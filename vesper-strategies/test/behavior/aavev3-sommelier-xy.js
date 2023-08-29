'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit, increaseTimeIfNeeded } = require('vesper-commons/utils/poolOps')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const { BigNumber } = require('ethers')
const { getStrategyToken } = require('vesper-commons/utils/setup')
const { getChainData } = require('vesper-commons/utils/chains')
const Address = getChainData().address

// Aave V3 Sommelier XY strategy specific tests
function shouldBehaveLikeAaveV3SommelierXY(strategyIndex) {
  let strategy, pool, collateralToken, token, borrowToken, vdToken, wrappedCollateral
  let governor, user1, user2
  const maxBps = BigNumber.from('10000')

  async function assertCurrentBorrow() {
    const aaveAddressProvider = await ethers.getContractAt(
      'PoolAddressesProvider',
      await strategy.aaveAddressProvider(),
    )
    const protocolDataProvider = await ethers.getContractAt(
      'AaveProtocolDataProvider',
      await aaveAddressProvider.getPoolDataProvider(),
    )
    const aaveOracle = await ethers.getContractAt('AaveOracle', await aaveAddressProvider.getPriceOracle())
    const collateralPrice = await aaveOracle.getAssetPrice(wrappedCollateral.address)
    const collateralDecimal = await wrappedCollateral.decimals()
    const borrowTokenPrice = await aaveOracle.getAssetPrice(borrowToken.address)
    const borrowTokenDecimal = await borrowToken.decimals()

    const collateralFactor = (await protocolDataProvider.getReserveConfigurationData(wrappedCollateral.address)).ltv
    const totalDebt = await token.balanceOf(strategy.address)

    const collateralForBorrow = totalDebt
      .mul(collateralPrice)
      .mul(collateralFactor)
      .div(maxBps)
      .div(BigNumber.from((10 ** collateralDecimal).toString()))

    const maxBorrowPossibleInBorrowToken = collateralForBorrow
      .mul(BigNumber.from((10 ** borrowTokenDecimal).toString()))
      .div(borrowTokenPrice)

    const borrowUpperBound = maxBorrowPossibleInBorrowToken.mul(await strategy.maxBorrowLimit()).div(maxBps)
    const borrowLowerBound = maxBorrowPossibleInBorrowToken.mul(await strategy.minBorrowLimit()).div(maxBps)
    const borrowed = await vdToken.balanceOf(strategy.address)
    expect(borrowed).to.be.lt(borrowUpperBound, 'Borrow more than max limit')
    expect(borrowed).to.be.closeTo(
      borrowLowerBound,
      borrowLowerBound.div(1000),
      'borrowed is too much deviated from minBorrowLimit',
    )
    return borrowed
  }

  describe('AaveV3SommelierXy specific tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      token = await getStrategyToken(this.strategies[strategyIndex])
      vdToken = await ethers.getContractAt('TokenLike', await strategy.vdToken())
      borrowToken = await ethers.getContractAt('ERC20', await strategy.borrowToken())
      const aToken = await ethers.getContractAt('AToken', token.address)
      wrappedCollateral = await ethers.getContractAt('ERC20', await aToken.UNDERLYING_ASSET_ADDRESS())
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
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      const borrowBefore = await assertCurrentBorrow()
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      // Withdraw will payback borrow
      const withdrawAmount = (await pool.balanceOf(user1.address)).div('3')
      await pool.connect(user1).withdraw(withdrawAmount)
      const borrowAfter = await assertCurrentBorrow()
      expect(borrowAfter).to.be.lt(borrowBefore, 'Borrowed not is not correct')
    })

    it('Borrowed Y amount should reflect in target Sommelier Vault', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      const borrowBalance = await vdToken.balanceOf(strategy.address)
      const cellarAbi = [
        'function convertToAssets(uint256) external view returns(uint256)',
        'function convertToShares(uint256) external view returns(uint256)',
        'function balanceOf(address) external view returns(uint256)',
      ]
      const cellar = await ethers.getContractAt(cellarAbi, await strategy.cellar())

      const actualCellarToken = await cellar.balanceOf(strategy.address)
      const expectedCellarToken = await cellar.convertToShares(borrowBalance)
      expect(expectedCellarToken).to.be.eq(actualCellarToken, 'Borrowed balance not reflecting in Sommelier vault')
    })

    it('Should update borrow limit', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
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
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      await strategy.connect(governor).updateBorrowLimit(8000, 9000)
      await strategy.connect(governor).rebalance()
      let borrowBefore = await assertCurrentBorrow()
      await strategy.connect(governor).updateBorrowLimit(6000, 7000)
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      await strategy.connect(governor).rebalance()
      let borrowAfter = await assertCurrentBorrow()
      expect(borrowAfter).to.be.lt(borrowBefore, 'Borrowed is not correct')
      await strategy.connect(governor).updateBorrowLimit(8000, 9000)
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      await strategy.connect(governor).rebalance()
      borrowBefore = borrowAfter
      borrowAfter = await assertCurrentBorrow()
      expect(borrowAfter).to.be.gt(borrowBefore, 'Borrowed is not correct')
    })

    it('Should claim and swap rewards to collateral', async function () {
      const wNative = await ethers.getContractAt('ERC20', Address.NATIVE_TOKEN)
      await deposit(pool, collateralToken, 10, user2)
      await strategy.rebalance()
      await mine(100)
      const wNativeBefore = await wNative.balanceOf(strategy.address)
      const amountOut = await strategy.callStatic.claimAndSwapRewards(0)
      await strategy.claimAndSwapRewards(amountOut)
      const wNativeAfter = await wNative.balanceOf(strategy.address)
      if (collateralToken.address == wNative.address) {
        expect(wNativeAfter).gt(wNativeBefore)
      } else {
        expect(wNativeAfter).eq(0)
      }
    })
  })
}
module.exports = { shouldBehaveLikeAaveV3SommelierXY }
