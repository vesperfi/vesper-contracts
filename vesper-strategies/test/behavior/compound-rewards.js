'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { mine, time } = require('@nomicfoundation/hardhat-network-helpers')
const { getStrategyToken } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')
const { getChain } = require('vesper-commons/utils/chains')
const chain = getChain()

// Compound (and fork) rewards tests
function shouldTestCompoundRewards(strategyIndex) {
  let strategy, pool, collateralToken, token
  let governor, user1, user2

  async function rewardAccrued() {
    let outcome
    if (getChain() === 'mainnet') {
      const comptroller = await ethers.getContractAt('Comptroller', await strategy.comptroller())
      return comptroller.compAccrued(strategy.address)
    }
    return outcome
  }

  describe('Compound rewards tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      token = await getStrategyToken(this.strategies[strategyIndex])
    })

    it('Should claim and swap rewards', async function () {
      await deposit(pool, collateralToken, 20, user1)
      await deposit(pool, collateralToken, 20, user2)
      await strategy.connect(governor).rebalance()
      await token.exchangeRateCurrent()

      // Increase block and time to earn rewards
      await mine(100)
      await time.increase(time.duration.days(5))

      const withdrawAmount = await pool.balanceOf(user2.address)
      // reward accrued is updated only when user do some activity.
      // withdraw to trigger reward accrued update
      await pool.connect(user2).withdraw(withdrawAmount)
      const rewardAccruedBefore = await rewardAccrued()

      if (rewardAccruedBefore > 0) {
        // Assert only when reward tokens are available.
        expect(rewardAccruedBefore).to.gt(0)
        const amountOut = await strategy.callStatic.claimAndSwapRewards(0)
        await strategy.claimAndSwapRewards(amountOut)
        const rewardAccruedAfter = await rewardAccrued()
        expect(rewardAccruedAfter).to.eq(0)
      }
    })

    it('Should liquidate rewardToken when claimed by external source', async function () {
      const comptroller = await strategy.comptroller()
      const rewardToken = await ethers.getContractAt('IERC20', strategy.rewardToken())
      // using bigger amount for other chains
      const amount = chain === 'mainnet' ? 20 : 500
      await deposit(pool, collateralToken, amount, user2)
      await deposit(pool, collateralToken, amount, user1)
      await strategy.connect(governor).rebalance()
      await token.exchangeRateCurrent()
      // Increase block and time to earn rewards
      await mine(100)
      await time.increase(time.duration.days(5))

      const withdrawAmount = await pool.balanceOf(user1.address)
      // reward accrued is updated only when user do some activity.
      // withdraw to trigger reward accrued update
      await pool.connect(user1).withdraw(withdrawAmount)
      const _rewardAccrued = await rewardAccrued()

      if (_rewardAccrued == 0) {
        return
      }

      if (chain === 'mainnet' || chain === 'optimism') {
        const comptrollerInstance = await ethers.getContractAt('Comptroller', comptroller)
        await comptrollerInstance.connect(user2).claimComp(strategy.address, [token.address])
      }
      const afterClaim = await rewardToken.balanceOf(strategy.address)
      expect(afterClaim).to.gt('0', 'rewardToken balance should be > 0')

      await token.exchangeRateCurrent()
      // Rewards may not be enough to get even 1 wei amountOut
      const amountOut = await strategy.callStatic.claimAndSwapRewards(0)
      await strategy.claimAndSwapRewards(amountOut)
    })
  })
}
module.exports = { shouldTestCompoundRewards }
