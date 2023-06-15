'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit } = require('vesper-commons/utils/poolOps')
const { mine, time } = require('@nomicfoundation/hardhat-network-helpers')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require('vesper-commons/utils/chains').getChainData().address

async function simulateVesperPoolProfit(strategy) {
  const vPool = await ethers.getContractAt('IVesperPool', await strategy.instance.vPool())
  const collateralTokenAddress = await vPool.token()
  const collateralToken = await ethers.getContractAt('IERC20Metadata', collateralTokenAddress)
  const collateralDecimal = await collateralToken.decimals()
  const poolBalance = await collateralToken.balanceOf(vPool.address)
  await adjustBalance(
    collateralTokenAddress,
    vPool.address,
    poolBalance.add(ethers.utils.parseUnits('5', collateralDecimal)),
  )
}

// FraxLend Vesper XY strategy specific tests
function shouldBehaveLikeFraxLendVesperXyStrategy(index) {
  let strategy, pool, collateralToken, fraxLend
  let user1, user2

  async function assertCurrentBorrow() {
    const borrowed = await fraxLend.toBorrowAmount(await fraxLend.userBorrowShares(strategy.address), true)
    const exchangeRate = (await fraxLend.exchangeRateInfo()).exchangeRate
    const collateralSupplied = await fraxLend.userCollateralBalance(strategy.address)
    const maxLTV = await fraxLend.maxLTV()
    const { _LTV_PRECISION, _EXCHANGE_PRECISION } = await fraxLend.getConstants()
    const maxBorrowPossible = collateralSupplied
      .mul(maxLTV)
      .mul(_EXCHANGE_PRECISION)
      .div(_LTV_PRECISION)
      .div(exchangeRate)
    const borrowUpperBound = maxBorrowPossible.mul(await strategy.maxBorrowLimit()).div(10000)
    const borrowLowerBound = maxBorrowPossible.mul(await strategy.minBorrowLimit()).div(10000)
    expect(borrowed).to.be.lt(borrowUpperBound, 'Borrow more than max limit')
    try {
      // In general borrowed will either be close to lower bound or between lower bound and upper bound.
      expect(borrowed).to.be.closeTo(
        borrowLowerBound,
        borrowLowerBound.div(100),
        'borrowed is too much deviated from minBorrowLimit',
      )
    } catch (e) {
      expect(borrowed, 'borrowed should be > lower bound').to.gte(borrowLowerBound)
    }
  }

  describe('FraxLendVesperXyStrategy specific tests', function () {
    beforeEach(async function () {
      ;[, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[index].instance
      collateralToken = this.collateralToken
      fraxLend = await ethers.getContractAt('IFraxLend', await strategy.token())
      await fraxLend.addInterest()
    })

    it('Validate that vPool is reserved token', async function () {
      const isReserved = await strategy.isReservedToken(await strategy.vPool())
      expect(isReserved).to.be.eq(true)
    })

    it('Should borrow tokens at rebalance', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.rebalance()
      expect(await strategy.borrowBalance()).gt(0)
    })

    it('Should borrow within defined limits', async function () {
      await deposit(pool, collateralToken, 10, user2)
      await strategy.rebalance()
      await mine(100)
      await fraxLend.addInterest()
      await strategy.rebalance()
      await assertCurrentBorrow()
    })

    it('Should adjust borrow to keep it within defined limits', async function () {
      await deposit(pool, collateralToken, 50, user1)
      await strategy.rebalance()
      await mine(100)
      await fraxLend.addInterest()
      const borrowBefore = await strategy.borrowBalance()
      const withdrawAmount = (await pool.balanceOf(user1.address)).div('2')
      await pool.connect(user1).withdraw(withdrawAmount)
      await fraxLend.addInterest()
      const borrowAfter = await strategy.borrowBalance()
      await assertCurrentBorrow()
      expect(borrowAfter).lt(borrowBefore)
    })

    it('Should repayAll and reset minBorrowLimit via governor', async function () {
      await deposit(pool, collateralToken, 50, user2)
      await strategy.rebalance()
      let borrowShares = await fraxLend.userBorrowShares(strategy.address)
      expect(borrowShares).gt(0)

      await strategy.repayAll()

      borrowShares = await fraxLend.userBorrowShares(strategy.address)
      expect(borrowShares).eq(0)
      const newMinBorrowLimit = await strategy.minBorrowLimit()
      expect(newMinBorrowLimit).eq(0)
    })

    it('Should update borrow limit', async function () {
      await deposit(pool, collateralToken, 50, user1)
      await strategy.rebalance()
      await mine(100)
      await strategy.updateBorrowLimit(5000, 6000)
      const newMinBorrowLimit = await strategy.minBorrowLimit()
      await strategy.rebalance()
      await fraxLend.addInterest()
      await assertCurrentBorrow()
      expect(newMinBorrowLimit).to.be.eq(5000, 'Min borrow limit is wrong')

      let tx = strategy.updateBorrowLimit(5000, ethers.constants.MaxUint256)
      await expect(tx).to.be.revertedWith('invalid-max-borrow-limit')

      tx = strategy.updateBorrowLimit(5500, 5000)
      await expect(tx).to.be.revertedWith('max-should-be-higher-than-min')
    })

    it('Should repay and borrow more based on updated borrow limit', async function () {
      await deposit(pool, collateralToken, 25, user1)
      await strategy.rebalance()
      await mine(100)
      await strategy.updateBorrowLimit(8000, 9000)
      await strategy.rebalance()
      let borrowSharesBefore = await fraxLend.userBorrowShares(strategy.address)
      await strategy.updateBorrowLimit(6000, 7000)
      await strategy.rebalance()
      let borrowSharesAfter = await fraxLend.userBorrowShares(strategy.address)
      expect(borrowSharesAfter).lt(borrowSharesBefore)
      await strategy.updateBorrowLimit(8000, 9000)
      await strategy.rebalance()
      borrowSharesBefore = borrowSharesAfter
      borrowSharesAfter = await fraxLend.userBorrowShares(strategy.address)
      expect(borrowSharesAfter).gt(borrowSharesBefore)
    })

    it('Should repay borrow if borrow limit set to 0', async function () {
      await deposit(pool, collateralToken, 50, user1)
      await strategy.rebalance()
      let borrowShares = await fraxLend.userBorrowShares(strategy.address)
      expect(borrowShares).gt(0)
      await strategy.updateBorrowLimit(0, 0)
      await strategy.rebalance()
      borrowShares = await fraxLend.userBorrowShares(strategy.address)
      expect(borrowShares).eq(0)
    })

    it('Underlying vPool should make profits and increase Y balance', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.rebalance()
      const borrowBefore = await strategy.borrowBalance()
      await simulateVesperPoolProfit(this.strategies[index])
      expect(await strategy.borrowBalance()).to.be.gt(borrowBefore)
      const data = await strategy.callStatic.rebalance()
      expect(data._profit).gt(0)
    })

    if (getChain() == 'mainnet' || getChain() == 'avalanche') {
      // Skipping test as there is no VSP rewards in vaFRAX pool.
      // eslint-disable-next-line mocha/no-skipped-tests
      it.skip('Should claim and swap VSP for collateral', async function () {
        const vsp = await ethers.getContractAt('ERC20', Address.Vesper.VSP, user2)
        // given
        await deposit(pool, collateralToken, 100, user2)
        await strategy.rebalance()

        // Time travel to earn some VSP
        await time.increase(time.duration.days(5))

        // when claim and swap rewards
        const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
        await strategy.claimAndSwapRewards(amountOut)

        // Verify no VSP left in strategy
        expect(await vsp.balanceOf(strategy.address)).eq(0)
      })
    }
  })
}
module.exports = { shouldBehaveLikeFraxLendVesperXyStrategy }
