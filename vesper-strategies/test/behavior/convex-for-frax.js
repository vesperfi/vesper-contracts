'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { getChainData } = require('vesper-commons/utils/chains')
const { deposit, increaseTimeIfNeeded } = require('vesper-commons/utils/poolOps')
const { createStrategy } = require('vesper-commons/utils/setup')
const { shouldBehaveLikeCrvStrategy } = require('./curve')

const Address = getChainData().address

// cvx strategy specific tests
function shouldBehaveLikeConvexForFraxStrategy(strategyIndex) {
  shouldBehaveLikeCrvStrategy(strategyIndex)
  const {
    Curve: { CRV },
    CVX,
    FXS,
  } = Address

  let strategy
  let governor
  let alice
  let pool
  let poolAccountant
  let collateralToken

  describe('ConvexForFrax specific tests', function () {
    beforeEach(async function () {
      ;[governor, alice] = this.users
      pool = this.pool
      poolAccountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
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
      await strategy.setRewardTokens([])

      // then
      // build expected tokens list (can't have duplicated items)
      const expected = [CRV, CVX, FXS]
      const rewards = await ethers.getContractAt('IMultiReward', await strategy.rewards())
      const rewardsLength = (await rewards.rewardTokenLength()).toNumber()
      for (let i = 0; i < rewardsLength; ++i) {
        const rewardToken = await rewards.rewardTokens(i)
        if (![CRV, CVX, FXS].includes(rewardToken)) {
          expected.push(rewardToken)
        }
      }
      for (let i = 0; i < expect.length; ++i) {
        expect(await strategy.rewardTokens(i)).eq(expected[i])
      }
    })

    describe('when strategy has some balance', function () {
      let vault

      beforeEach(async function () {
        vault = await ethers.getContractAt('IStakingProxyConvex', await strategy.vault())
        await deposit(pool, collateralToken, 10, alice)
        await strategy.rebalance()
        await time.increase(time.duration.days(1))
      })

      it('Should claim all rewards during rebalance', async function () {
        // given
        const claimableBefore = await vault.earned()
        expect(claimableBefore.token_addresses).deep.eq([FXS, CRV, CVX])
        claimableBefore.total_earned.forEach(earned => expect(earned).gt(0))

        // when
        await increaseTimeIfNeeded(this.strategies[strategyIndex])
        const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
        await strategy.claimAndSwapRewards(amountOut)

        // then
        const claimableAfter = await vault.earned()
        claimableAfter.total_earned.forEach(earned => expect(earned).eq(0))
      })

      it('Should claim all rewards after unstakingAll', async function () {
        // given
        const claimableBefore = await vault.earned()
        expect(claimableBefore.token_addresses).deep.eq([FXS, CRV, CVX])
        claimableBefore.total_earned.forEach(earned => expect(earned).gt(0))

        // when
        await increaseTimeIfNeeded(this.strategies[strategyIndex])
        await poolAccountant.updateDebtRatio(strategy.address, 0) // force withdraw all
        expect(await strategy.tvl()).gt(0)
        // Unstake all as debtRatio is updated to 0
        await strategy.rebalance()
        expect(await strategy.tvl()).eq(0)
        // Claim rewards
        const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
        await strategy.claimAndSwapRewards(amountOut)

        // then
        const claimableAfter = await vault.earned()
        claimableAfter.total_earned.forEach(earned => expect(earned).eq(0))
      })

      it('Should claim rewards of old strategy after migration', async function () {
        //
        // given
        //
        const { debtRatio } = await poolAccountant.strategy(strategy.address)
        expect(debtRatio).eq(10000)
        expect(await strategy.lpBalanceStaked()).gt(0)
        const claimableBefore = await vault.earned()
        expect(claimableBefore.token_addresses).deep.eq([FXS, CRV, CVX])
        claimableBefore.total_earned.forEach(earned => expect(earned).gt(0))

        //
        // Migrate to new strategy
        //
        const newStrategy = await createStrategy(this.strategies[strategyIndex], pool.address, { skipVault: true })
        // wait until lock period ending
        await increaseTimeIfNeeded(this.strategies[strategyIndex])
        // pull out money from old strategy
        await poolAccountant.updateDebtRatio(strategy.address, 0)
        await strategy.rebalance()
        // migrate
        await pool.connect(governor).migrateStrategy(strategy.address, newStrategy.address)
        // push money to the new strategy
        await poolAccountant.updateDebtRatio(newStrategy.address, debtRatio)
        await newStrategy.rebalance()

        //
        // When calling claim on old strategy
        //
        await strategy.claimAndSwapRewards(0)

        //
        // then
        //
        const claimableAfter = await vault.earned()
        claimableAfter.total_earned.forEach(earned => expect(earned).eq(0))
        expect(await strategy.lpBalanceStaked()).eq(0)
        expect(await newStrategy.lpBalanceStaked()).gt(0)
      })
    })
  })
}

module.exports = { shouldBehaveLikeConvexForFraxStrategy }
