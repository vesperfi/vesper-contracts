'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { getChainData } = require('vesper-commons/utils/chains')
const { deposit } = require('vesper-commons/utils/poolOps')
const { createStrategy } = require('vesper-commons/utils/setup')
const { shouldBehaveLikeCrvStrategy } = require('./curve')

const Address = getChainData().address

// cvx strategy specific tests
function shouldBehaveLikeConvexStrategy(strategyIndex) {
  const {
    Curve: { CRV },
    CVX,
  } = Address
  shouldBehaveLikeCrvStrategy(strategyIndex)
  let strategy
  let governor
  let alice
  let pool
  let collateralToken
  let cvx

  describe('Convex specific tests', function () {
    beforeEach(async function () {
      ;[governor, alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      cvx = await ethers.getContractAt('ERC20', CVX)
    })

    it('Should get staked LPs', async function () {
      // given
      await deposit(pool, collateralToken, 1, alice)
      expect(await strategy.lpBalanceStaked()).eq(0)

      // when
      await strategy.rebalance()

      // then
      expect(await strategy.lpBalanceStaked()).gt(0)
    })

    it('Should set reward tokens', async function () {
      // given
      expect(await strategy.rewardTokens(0)).eq(CRV)
      expect(strategy.rewardTokens(1)).revertedWithoutReason()

      // when
      await strategy.refetchRewardTokens([])

      // then
      // build expected tokens list (can't have duplicated items)
      const expected = [CRV, CVX]
      const rewards = await ethers.getContractAt('Rewards', await strategy.cvxCrvRewards())
      const extraRewardsLength = (await rewards.extraRewardsLength()).toNumber()
      for (let i = 0; i < extraRewardsLength; ++i) {
        const extraReward = await ethers.getContractAt('Rewards', await rewards.extraRewards(i))
        const extraRewardToken = await extraReward.rewardToken()
        if (extraRewardToken !== CRV && extraRewardToken !== CVX) {
          expected.push(await strategy.rewardTokens(i + 2))
        }
      }
      for (let i = 0; i < expect.length; ++i) {
        expect(await strategy.rewardTokens(i)).eq(expected[i])
      }
    })

    it('Should claim and swap all rewards', async function () {
      const rewards = await ethers.getContractAt('Rewards', await strategy.cvxCrvRewards())
      const periodFinish = await rewards.periodFinish()
      const blockTimestamp = (await ethers.provider.getBlock()).timestamp
      const queuedRewards = await rewards.queuedRewards()
      if (queuedRewards.eq(0) || periodFinish.lte(blockTimestamp)) {
        // No rewards to distribute
        return
      }

      // given
      await deposit(pool, collateralToken, 10, alice)

      expect(await rewards.balanceOf(strategy.address)).eq(0)
      await strategy.rebalance()
      expect(await rewards.balanceOf(strategy.address)).gt(0)

      expect(await rewards.earned(strategy.address)).eq(0)
      await time.increase(time.duration.days(1))
      expect(await rewards.earned(strategy.address)).gt(0)

      // when
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      // then
      expect(await rewards.earned(strategy.address)).eq(0)
    })

    it('Should claim rewards during migration', async function () {
      const rewards = await ethers.getContractAt('Rewards', await strategy.cvxCrvRewards())
      const periodFinish = await rewards.periodFinish()
      const blockTimestamp = (await ethers.provider.getBlock()).timestamp
      const queuedRewards = await rewards.queuedRewards()
      if (queuedRewards.eq(0) || periodFinish.lte(blockTimestamp)) {
        // No rewards to distribute
        return
      }

      // given
      await deposit(pool, collateralToken, 10, alice)

      await strategy.rebalance()
      expect(await rewards.balanceOf(strategy.address)).gt(0)

      await time.increase(time.duration.days(1))
      expect(await rewards.earned(strategy.address)).gt(0)
      expect(await cvx.balanceOf(strategy.address)).eq(0)

      // when
      const newStrategy = await createStrategy(this.strategies[strategyIndex], pool.address, { skipVault: true })
      // Migrate will claim rewards during unstake call but it will NOT swap those.
      await pool.connect(governor).migrateStrategy(strategy.address, newStrategy.address)

      // then
      expect(await rewards.earned(strategy.address)).eq(0)
      expect(await rewards.balanceOf(strategy.address)).eq(0)
      expect(await cvx.balanceOf(strategy.address)).gt(0)
    })
  })
}

module.exports = { shouldBehaveLikeConvexStrategy }
