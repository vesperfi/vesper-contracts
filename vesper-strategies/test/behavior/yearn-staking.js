'use strict'

const { expect } = require('chai')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const hre = require('hardhat')
const { ethers } = hre

// Yearn staking strategy specific tests
function shouldBehaveLikeYearnStakingStrategy(strategyIndex) {
  let strategy, user1, pool, collateralToken, rewardToken, stakingRewards, yTokenReward

  describe('YearnStaking Strategy specific tests', function () {
    beforeEach(async function () {
      ;[user1] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken

      rewardToken = await ethers.getContractAt('ERC20', await strategy.rewardToken())
      stakingRewards = await ethers.getContractAt('IStakingRewards', await strategy.stakingRewards())
      yTokenReward = await ethers.getContractAt('IYToken', await stakingRewards.rewardsToken())
    })

    it('Should claim rewards', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.rebalance()
      await helpers.time.increase(60 * 60)
      const withdrawAmount = await pool.balanceOf(user1.address)
      // reward is updated only when user do some activity.
      await pool.connect(user1).withdraw(withdrawAmount)
      const yTokenEarnedBefore = await stakingRewards.earned(strategy.address)
      expect(yTokenEarnedBefore).gt(0, 'reward accrued should be > 0 before rebalance')

      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      const yTokenEarnedAfter = await stakingRewards.earned(strategy.address)
      expect(yTokenEarnedAfter).eq(0, 'reward accrued should be 0 after rebalance')
    })

    it('Should liquidate yTokenRewards when claimed by external source', async function () {
      await deposit(pool, collateralToken, 1, user1)
      await strategy.rebalance()
      const balance = ethers.utils.parseEther('10')
      await adjustBalance(yTokenReward.address, strategy.address, balance)
      const beforeSwap = await yTokenReward.balanceOf(strategy.address)
      expect(beforeSwap).gt(0, 'yTokenReward balance should increase in strategy before swap')

      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      const afterSwap = await yTokenReward.balanceOf(strategy.address)
      expect(afterSwap).to.be.equal('0', 'yTokenReward balance should be 0 in strategy after swap')
    })

    it('Should liquidate rewardToken when send by anyone', async function () {
      await deposit(pool, collateralToken, 1, user1)
      await strategy.rebalance()
      const balance = ethers.utils.parseEther('10')
      await adjustBalance(rewardToken.address, strategy.address, balance)
      const beforeSwap = await rewardToken.balanceOf(strategy.address)
      expect(beforeSwap).gt(0, 'reward balance should increase in strategy before swap')

      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      const afterSwap = await rewardToken.balanceOf(strategy.address)
      expect(afterSwap).to.be.equal('0', 'reward balance should be 0 in strategy after swap')
    })
  })
}

module.exports = { shouldBehaveLikeYearnStakingStrategy }
