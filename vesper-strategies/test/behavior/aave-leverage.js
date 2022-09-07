'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')

const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const { getStrategyToken } = require('vesper-commons/utils/setup')
const { deposit, makeStrategyProfitable } = require('vesper-commons/utils/poolOps')
const { getChain } = require('vesper-commons/utils/chains')
const address = require(`vesper-commons/config/${getChain()}/address`)
// Aave Leverage strategy specific tests
function shouldBehaveLikeAaveLeverageStrategy(strategyIndex) {
  let strategy, pool, collateralToken, token, vdToken
  let governor, user1, user2

  async function isMarketExist() {
    if (address.DyDx && address.DyDx.SOLO) {
      const solo = await ethers.getContractAt('ISoloMargin', address.DyDx.SOLO)
      const totalMarkets = await solo.getNumMarkets()

      for (let i = 0; i < totalMarkets; i++) {
        const tokenAddress = await solo.getMarketTokenAddress(i)
        if (collateralToken.address === tokenAddress) {
          return true
        }
      }
    }
    return false
  }

  describe('AaveLeverageStrategy specific tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      token = await getStrategyToken(this.strategies[strategyIndex])
      vdToken = await ethers.getContractAt('TokenLike', await strategy.vdToken())
    })

    it('Should work as expected when debtRatio is 0', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      let position = await strategy.getPosition()

      expect(position._supply).to.gt(0, 'Incorrect supply')
      expect(position._borrow).to.gt(0, 'Incorrect borrow')
      expect(await pool.totalDebtOf(strategy.address)).to.gt(0, 'Incorrect total debt of strategy')
      await makeStrategyProfitable(strategy, collateralToken)

      const accountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
      await accountant.updateDebtRatio(strategy.address, 0)

      await strategy.connect(governor).rebalance()
      position = await strategy.getPosition()
      expect(position._supply).to.eq(0, 'Incorrect supply')
      expect(position._borrow).to.eq(0, 'Incorrect borrow')
      expect(await pool.totalDebtOf(strategy.address)).to.eq(0, 'Incorrect total debt of strategy')
    })

    it('Should work as expected when debtRatio is 10%', async function () {
      await deposit(pool, collateralToken, 50, user1)
      await strategy.connect(governor).rebalance()
      let position = await strategy.getPosition()

      expect(position._supply).to.gt(0, 'Incorrect supply')
      expect(position._borrow).to.gt(0, 'Incorrect borrow')
      expect(await pool.totalDebtOf(strategy.address)).to.gt(0, 'Incorrect total debt of strategy')

      const accountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
      await accountant.updateDebtRatio(strategy.address, 1000)

      await strategy.connect(governor).rebalance()
      position = await strategy.getPosition()
      expect(position._supply).to.gt(0, 'Incorrect supply')
      expect(position._borrow).to.gt(0, 'Incorrect borrow')
      expect(await pool.totalDebtOf(strategy.address)).to.gt(0, 'Incorrect total debt of strategy')
    })

    it('Should borrow collateral at rebalance', async function () {
      const depositAmount = await deposit(pool, collateralToken, 10, user1)
      await strategy.connect(governor).rebalance()
      const collateralBalance = await token.balanceOf(strategy.address)
      expect(collateralBalance).to.gt(depositAmount, 'Leverage should increase collateral')
    })

    it('Should borrow within defined limits', async function () {
      await deposit(pool, collateralToken, 100, user2)
      await strategy.connect(governor).rebalance()
      await strategy.connect(governor).rebalance()

      const minBorrowRatio = await strategy.minBorrowRatio()
      const maxBorrowRatio = await strategy.maxBorrowRatio()
      const borrowRatio = await strategy.currentBorrowRatio()
      expect(borrowRatio).to.eq(minBorrowRatio, 'Borrow should be == min borrow ratio')
      expect(borrowRatio).to.lt(maxBorrowRatio, 'Borrow should be < max borrow ratio')
    })

    it('Should adjust borrow to keep it within defined limits', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      await mine(100)

      const collateralBefore = await token.balanceOf(strategy.address)

      // Withdraw will increase borrow ratio.
      const withdrawAmount = (await pool.balanceOf(user1.address)).div('3')
      await pool.connect(user1).withdraw(withdrawAmount)

      const collateralAfter = await token.balanceOf(strategy.address)
      const minBorrowRatio = await strategy.minBorrowRatio()
      const maxBorrowRatio = await strategy.maxBorrowRatio()
      let borrowRatio = await strategy.currentBorrowRatio()
      expect(borrowRatio).to.gt(minBorrowRatio, 'Borrow should be > min borrow ratio')
      expect(borrowRatio).to.lte(maxBorrowRatio, 'Borrow should be <= max borrow ratio')

      expect(collateralAfter).to.lt(collateralBefore, 'Borrow amount after withdraw should be less')

      // Rebalance may adjust borrow ratio to equal to min. If ratio is between min and max then do nothing.
      await strategy.connect(governor).rebalance()
      borrowRatio = await strategy.currentBorrowRatio()
      expect(borrowRatio).to.gte(minBorrowRatio, 'Borrow should be >= min borrow ratio')
      expect(borrowRatio).to.lt(maxBorrowRatio, 'Borrow should be < max borrow ratio')
    })

    it('Should verify that Aave flash loan works', async function () {
      await strategy.connect(governor).updateFlashLoanStatus(false, true)
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      await mine(100)

      // Withdraw will increase borrow ratio
      const withdrawAmount = (await pool.balanceOf(user1.address)).div('2')
      await pool.connect(user1).withdraw(withdrawAmount)

      const minBorrowRatio = await strategy.minBorrowRatio()
      const maxBorrowRatio = await strategy.maxBorrowRatio()
      let borrowRatio = await strategy.currentBorrowRatio()
      expect(borrowRatio).to.gte(minBorrowRatio, 'Borrow should be >= min borrow ratio')
      expect(borrowRatio).to.lte(maxBorrowRatio, 'Borrow should be <= max borrow ratio')

      // Rebalance may adjust borrow ratio to equal to min. If ratio is between min and max then do nothing.
      await strategy.connect(governor).rebalance()
      borrowRatio = await strategy.currentBorrowRatio()
      // Due to Aave flash loan fee borrow ration will be higher than min
      expect(borrowRatio).to.gt(minBorrowRatio, 'Borrow should be > min borrow ratio')
      expect(borrowRatio).to.lt(maxBorrowRatio, 'Borrow should be < max borrow ratio')
    })

    it('Should verify that DyDx flash loan works', async function () {
      if (await isMarketExist()) {
        await strategy.connect(governor).updateFlashLoanStatus(true, false)
        await deposit(pool, collateralToken, 100, user1)
        await strategy.connect(governor).rebalance()
        await mine(100)

        // Withdraw will increase borrow ratio
        const withdrawAmount = (await pool.balanceOf(user1.address)).div('3')
        await pool.connect(user1).withdraw(withdrawAmount)

        const minBorrowRatio = await strategy.minBorrowRatio()
        const maxBorrowRatio = await strategy.maxBorrowRatio()
        let borrowRatio = await strategy.currentBorrowRatio()
        expect(borrowRatio).to.gte(minBorrowRatio, 'Borrow should be >= min borrow ratio')
        expect(borrowRatio).to.lte(maxBorrowRatio, 'Borrow should be <= max borrow ratio')

        // Rebalance may adjust borrow ratio to equal to min. If ratio is between min and max then do nothing.
        await strategy.connect(governor).rebalance()
        borrowRatio = await strategy.currentBorrowRatio()
        expect(borrowRatio).to.gte(minBorrowRatio, 'Borrow should be equal to min borrow ratio')
        expect(borrowRatio).to.lt(maxBorrowRatio, 'Borrow should be < max borrow ratio')
      } else {
        // eslint-disable-next-line no-console
        console.log('Skipping test:: No DYDX support on %s ', process.env.TEST_CHAIN.toUpperCase())
      }
    })

    it('Should update borrow ratio', async function () {
      const minRatio = (await strategy.minBorrowRatio()).add(200)
      let maxRatio = minRatio.add(300)
      await deposit(pool, collateralToken, 100, user2)
      await strategy.connect(governor).rebalance()
      await mine(100)
      const borrowRatioBefore = await strategy.currentBorrowRatio()
      await strategy.connect(governor).updateBorrowRatio(minRatio, maxRatio)
      const newMinBorrowRatio = await strategy.minBorrowRatio()
      expect(newMinBorrowRatio).to.eq(minRatio, 'Min borrow limit is wrong')
      const newMaxBorrowRatio = await strategy.maxBorrowRatio()
      expect(newMaxBorrowRatio).to.eq(maxRatio, 'Max borrow limit is wrong')

      await strategy.connect(governor).rebalance()
      const borrowRatioAfter = await strategy.currentBorrowRatio()
      expect(borrowRatioAfter).to.gt(borrowRatioBefore, 'Borrow ratio after should be greater')
      expect(parseInt(borrowRatioAfter) - parseInt(newMinBorrowRatio)).to.lt(1, 'Borrow should be ~= min borrow ratio')
      maxRatio = 9500
      let tx = strategy.connect(governor).updateBorrowRatio(minRatio, maxRatio)
      await expect(tx).to.revertedWith('21')
      maxRatio = minRatio.sub(100)
      tx = strategy.connect(governor).updateBorrowRatio(minRatio, maxRatio)
      await expect(tx).to.revertedWith('22')
    })

    it('Should repay borrow if borrow limit set to 0', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.connect(governor).rebalance()
      const borrowBefore = await vdToken.balanceOf(strategy.address)
      expect(borrowBefore).to.gt(0, 'Borrow amount should be > 0')
      await strategy.connect(governor).updateBorrowRatio(0, 4000)
      await strategy.connect(governor).rebalance()
      const borrowAfter = await vdToken.balanceOf(strategy.address)
      // There may be few wei dust
      expect(borrowAfter).closeTo(0, 5, 'Borrow amount should be = 0')
    })

    it('Should calculate tvl', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.connect(governor).rebalance()
      await mine(100)
      const tvl = await strategy.tvl()
      expect(tvl).to.gt(0, 'incorrect tvl')
    })
  })
}
module.exports = { shouldBehaveLikeAaveLeverageStrategy }
