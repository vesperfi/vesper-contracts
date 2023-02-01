'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit } = require('vesper-commons/utils/poolOps')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const { BigNumber } = require('ethers')
const { adjustBalance } = require('vesper-commons/utils/balance')

const Address = require('vesper-commons/utils/chains').getChainData().address

// Euler_Vesper_Xy strategy specific tests
function shouldBehaveLikeEulerVesperXY(strategyIndex) {
  let strategy, pool, collateralToken, borrowToken, borrowDToken
  let governor, user1, user2
  const MAX_BPS = BigNumber.from('10000')
  const EULER_CONFIG_FACTOR_SCALE = ethers.utils.parseUnits('4', '9')

  async function assertCurrentBorrow() {
    const eulerExec = await ethers.getContractAt('IExec', Address.Euler.Exec)
    const eulerMarkets = await ethers.getContractAt('IEulerMarkets', Address.Euler.Markets)
    const eToken = await ethers.getContractAt('IEToken', await strategy.receiptToken())

    const collateralUnit = ethers.utils.parseUnits('1', await collateralToken.decimals())
    const borrowTokenDecimal = await (await ethers.getContractAt('ERC20', borrowToken)).decimals()
    const borrowTokenUnit = ethers.utils.parseUnits('1', borrowTokenDecimal)

    const collateralPrice = (await eulerExec.callStatic.getPrice(collateralToken.address)).twap
    const borrowTokenPrice = (await eulerExec.callStatic.getPrice(borrowToken)).twap

    const supplied = await eToken.balanceOfUnderlying(strategy.address)

    const cfOfCollateral = (await eulerMarkets.underlyingToAssetConfig(collateralToken.address)).collateralFactor

    const bfOfBorrow = (await eulerMarkets.underlyingToAssetConfig(borrowToken)).borrowFactor
    const effectiveFactor = BigNumber.from(cfOfCollateral).mul(bfOfBorrow).div(EULER_CONFIG_FACTOR_SCALE)

    const actualCollateralForBorrow = supplied
      .mul(effectiveFactor)
      .mul(collateralPrice)
      .div(EULER_CONFIG_FACTOR_SCALE)
      .div(collateralUnit)
    const maxBorrowPossible = actualCollateralForBorrow.mul(borrowTokenUnit).div(borrowTokenPrice)

    const borrowUpperBound = maxBorrowPossible.mul(await strategy.maxBorrowLimit()).div(MAX_BPS)
    const borrowLowerBound = maxBorrowPossible.mul(await strategy.minBorrowLimit()).div(MAX_BPS)

    const borrowed = await borrowDToken.balanceOf(strategy.address)
    expect(borrowed).to.be.lt(borrowUpperBound, 'Borrow more than max limit')
    expect(borrowed).to.be.closeTo(borrowLowerBound, borrowLowerBound.div(1000))

    return borrowed
  }
  describe('EulerVesperXy specific tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      borrowDToken = await ethers.getContractAt('TokenLike', await strategy.borrowDToken())
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
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      const borrowBefore = await assertCurrentBorrow()
      await mine(100)
      // Withdraw will payback borrow
      const withdrawAmount = (await pool.balanceOf(user1.address)).div('3')
      await pool.connect(user1).withdraw(withdrawAmount)
      const borrowAfter = await assertCurrentBorrow()
      expect(borrowAfter).to.be.lt(borrowBefore, 'Borrowed not is not correct')
    })

    it('Borrowed Y amount should reflect in target Vesper Pool', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      const borrowBalance = await borrowDToken.balanceOf(strategy.address)
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
      expect(newMinBorrowLimit).to.be.eq(5000, 'Min borrow limit is wrong')
      await strategy.connect(governor).rebalance()
      await assertCurrentBorrow()
      let tx = strategy.connect(governor).updateBorrowLimit(5000, ethers.constants.MaxUint256)
      await expect(tx).to.be.revertedWith('invalid-max-borrow-limit')

      tx = strategy.connect(governor).updateBorrowLimit(5500, 5000)
      await expect(tx).to.be.revertedWith('max-should-be-higher-than-min')
    })

    it('Should repay and borrow more based on updated borrow limit', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      await mine(100)
      await strategy.connect(governor).updateBorrowLimit(8000, 9000)
      await strategy.connect(governor).rebalance()
      let borrowBefore = await assertCurrentBorrow()
      await strategy.connect(governor).updateBorrowLimit(6000, 7000)
      await strategy.connect(governor).rebalance()
      let borrowAfter = await assertCurrentBorrow()
      expect(borrowAfter).to.be.lt(borrowBefore, 'Borrowed is not correct')
      await strategy.connect(governor).updateBorrowLimit(8000, 9000)
      await strategy.connect(governor).rebalance()
      borrowBefore = borrowAfter
      borrowAfter = await assertCurrentBorrow()
      expect(borrowAfter).to.be.gt(borrowBefore, 'Borrowed is not correct')
    })

    it('Should swap EUL rewards when claimed by external source', async function () {
      const eul = await ethers.getContractAt('ERC20', Address.Euler.EUL, user2)
      await deposit(pool, collateralToken, 10, user2)
      await strategy.rebalance()
      // Get some EUL at strategy address
      await adjustBalance(eul.address, strategy.address, ethers.utils.parseEther('10'))
      expect(await eul.balanceOf(strategy.address)).gt(0)
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      expect(await eul.balanceOf(strategy.address)).eq(0)
    })
  })
}
module.exports = { shouldBehaveLikeEulerVesperXY }
