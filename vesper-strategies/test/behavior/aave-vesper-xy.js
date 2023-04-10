'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit } = require('vesper-commons/utils/poolOps')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const { BigNumber } = require('ethers')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { shouldTestStkAaveRewards } = require('./stk-aave-rewards')
const Address = require('vesper-commons/utils/chains').getChainData().address

// AaveV2VesperXY strategy specific tests
function shouldBehaveLikeAaveVesperXY(strategyIndex) {
  let strategy, pool, collateralToken, borrowToken, vdToken
  let governor, user1, user2
  const maxBps = BigNumber.from('10000')
  async function assertCurrentBorrow() {
    const aaveAddressProvider = await ethers.getContractAt('PoolAddressesProvider', Address.Aave.AddressProvider)
    const aaveLendingPool = await ethers.getContractAt('AaveLendingPool', await strategy.aaveLendingPool())
    const protocolDataProvider = await ethers.getContractAt(
      'AaveProtocolDataProvider',
      await strategy.aaveProtocolDataProvider(),
    )
    const aaveOracle = await ethers.getContractAt('AaveOracle', await aaveAddressProvider.getPriceOracle())
    const strategyAccountData = await aaveLendingPool.getUserAccountData(strategy.address)
    const borrowTokenObj = await ethers.getContractAt('ERC20', borrowToken)
    const borrowTokenPrice = await aaveOracle.getAssetPrice(borrowToken)
    const borrowTokenDecimal = await borrowTokenObj.decimals()
    const maxBorrowPossibleETH = strategyAccountData.totalDebtETH.add(strategyAccountData.availableBorrowsETH)
    const maxBorrowPossibleInBorrowToken = maxBorrowPossibleETH
      .mul(ethers.utils.parseUnits('1', borrowTokenDecimal))
      .div(borrowTokenPrice)
    const borrowUpperBound = maxBorrowPossibleInBorrowToken.mul(await strategy.maxBorrowLimit()).div(maxBps)
    const borrowLowerBound = maxBorrowPossibleInBorrowToken.mul(await strategy.minBorrowLimit()).div(maxBps)
    const borrowed = await vdToken.balanceOf(strategy.address)
    const aBorrowToken = (await protocolDataProvider.getReserveTokensAddresses(borrowToken)).aTokenAddress

    const availableLiquidity = await borrowTokenObj.balanceOf(aBorrowToken)
    // If liquidity is zero that means rebalance already borrowed all and hence borrowed > 0
    if (availableLiquidity.eq(0)) {
      expect(borrowed).gt(0)
    } else {
      expect(borrowed).to.be.lt(borrowUpperBound, 'Borrow more than max limit')
      expect(borrowed).to.be.closeTo(
        borrowLowerBound,
        borrowLowerBound.mul(1).div(1000),
        'borrowed is too much deviated from minBorrowLimit',
      )
    }
    return strategyAccountData
  }

  // Aave rewards test
  shouldTestStkAaveRewards(strategyIndex)

  describe('AaveV2VesperXy specific tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      vdToken = await ethers.getContractAt('TokenLike', await strategy.vdToken())
      borrowToken = await strategy.borrowToken()
    })

    it('Should borrow collateral at rebalance', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.connect(governor).rebalance()
      await assertCurrentBorrow()
    })

    it('Should borrow within defined limits', async function () {
      await deposit(pool, collateralToken, 100, user2)
      await strategy.connect(governor).rebalance()
      await strategy.connect(governor).rebalance()
      await assertCurrentBorrow()
    })

    it('Should adjust borrow to keep it within defined limits', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.connect(governor).rebalance()
      const accountDataBefore = await assertCurrentBorrow()
      await mine(100)
      // Withdraw will payback borrow
      const withdrawAmount = (await pool.balanceOf(user1.address)).div('3')
      await pool.connect(user1).withdraw(withdrawAmount)
      const accountDataAfter = await assertCurrentBorrow()
      expect(accountDataAfter.totalDebtETH).to.be.lt(accountDataBefore.totalDebtETH, 'Borrowed not is not correct')
    })

    it('Borrowed Y amount should reflect in target Vesper Pool', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      const borrowBalance = await vdToken.balanceOf(strategy.address)
      const vPool = await ethers.getContractAt('IVesperPool', await strategy.vPool())
      const actualVTokens = await vPool.balanceOf(strategy.address)
      const vPoolPricePerShare = await vPool.pricePerShare()
      const decimal18 = ethers.utils.parseEther('1')
      // Actual logic inside pool contract
      let expectedVTokens = borrowBalance.mul(decimal18).div(vPoolPricePerShare)
      expectedVTokens =
        borrowBalance > expectedVTokens.mul(vPoolPricePerShare).div(decimal18)
          ? expectedVTokens.add(BigNumber.from('1'))
          : expectedVTokens
      expect(expectedVTokens).to.be.eq(actualVTokens, 'Borrowed balance not reflecting in Vesper Pool')
    })

    it('Should update borrow limit', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      await mine(100)
      await strategy.connect(governor).updateBorrowLimit(5000, 6000)
      const newMinBorrowLimit = await strategy.minBorrowLimit()
      await strategy.connect(governor).rebalance()
      expect(newMinBorrowLimit).to.be.eq(5000, 'Min borrow limit is wrong')
      await assertCurrentBorrow()
      let tx = strategy.connect(governor).updateBorrowLimit(5000, ethers.constants.MaxUint256)
      await expect(tx).to.be.revertedWith('invalid-max-borrow-limit')

      tx = strategy.connect(governor).updateBorrowLimit(5500, 5000)
      await expect(tx).to.be.revertedWith('max-should-be-higher-than-min')
    })

    it('Should repay and borrow more based on updated borrow limit', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.connect(governor).rebalance()
      await mine(100)
      await strategy.connect(governor).updateBorrowLimit(8000, 9000)
      await strategy.connect(governor).rebalance()
      let accountDataBefore = await assertCurrentBorrow()
      await strategy.connect(governor).updateBorrowLimit(6000, 7000)
      await strategy.connect(governor).rebalance()
      let accountDataAfter = await assertCurrentBorrow()
      expect(accountDataAfter.totalDebtETH).to.be.lt(accountDataBefore.totalDebtETH, 'Borrowed is not correct')
      await strategy.connect(governor).updateBorrowLimit(8000, 9000)
      await strategy.connect(governor).rebalance()
      accountDataBefore = accountDataAfter
      accountDataAfter = await assertCurrentBorrow()
      expect(accountDataAfter.totalDebtETH).to.be.gt(accountDataBefore.totalDebtETH, 'Borrowed is not correct')
    })

    it('Should claim VSP', async function () {
      const vsp = await ethers.getContractAt('ERC20', Address.Vesper.VSP, user2)

      // given
      await deposit(pool, collateralToken, 100, user2)
      await strategy.rebalance()
      expect(await vsp.balanceOf(strategy.address)).eq(0)
      // Send some VSP to strategy
      await adjustBalance(vsp.address, strategy.address, ethers.utils.parseEther('10'))
      expect(await vsp.balanceOf(strategy.address)).gt(0)

      // when claim and swap rewards
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      // Verify no VSP left in strategy
      expect(await vsp.balanceOf(strategy.address)).eq(0)
    })
  })
}
module.exports = { shouldBehaveLikeAaveVesperXY }
