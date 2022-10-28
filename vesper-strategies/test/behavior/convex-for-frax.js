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
  const {
    Curve: { CRV },
    CVX,
    FXS,
  } = Address
  shouldBehaveLikeCrvStrategy(strategyIndex)
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

    it('Should claim all rewards during rebalance', async function () {
      const vault = await ethers.getContractAt('IStakingProxyConvex', await strategy.vault())

      // given
      await deposit(pool, collateralToken, 10, alice)
      await strategy.rebalance()
      await time.increase(time.duration.days(1))

      const before = await vault.earned()
      expect(before.token_addresses).deep.eq([FXS, CRV, CVX])
      const [fxsBefore, crvBefore, cvxBefore] = before.total_earned
      expect(fxsBefore).gt(0)
      expect(crvBefore).gt(0)
      expect(cvxBefore).gt(0)

      // when
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      await strategy.rebalance()

      // then
      const after = await vault.earned()
      const [fxsAfter, crvAfter, cvxAfter] = after.total_earned
      expect(fxsAfter).eq(0)
      expect(crvAfter).eq(0)
      expect(cvxAfter).eq(0)
    })

    it('Should claim all rewards when unstaking', async function () {
      const vault = await ethers.getContractAt('IStakingProxyConvex', await strategy.vault())

      // given
      await deposit(pool, collateralToken, 10, alice)
      await strategy.rebalance()
      await time.increase(time.duration.days(1))

      const before = await vault.earned()
      expect(before.token_addresses).deep.eq([FXS, CRV, CVX])
      const [fxsBefore, crvBefore, cvxBefore] = before.total_earned
      expect(fxsBefore).gt(0)
      expect(crvBefore).gt(0)
      expect(cvxBefore).gt(0)

      // when
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      await poolAccountant.updateDebtRatio(strategy.address, 0) // force withdraw all
      expect(await strategy.tvl()).gt(0)
      await strategy.rebalance()
      expect(await strategy.tvl()).eq(0)

      // then
      const after = await vault.earned()
      const [fxsAfter, crvAfter, cvxAfter] = after.total_earned
      expect(fxsAfter).eq(0)
      expect(crvAfter).eq(0)
      expect(cvxAfter).eq(0)
    })

    it('Should claim rewards during migration', async function () {
      const vault = await ethers.getContractAt('IStakingProxyConvex', await strategy.vault())

      // given
      await deposit(pool, collateralToken, 10, alice)
      await strategy.rebalance()
      await time.increase(time.duration.days(1))

      const before = await vault.earned()
      expect(before.token_addresses).deep.eq([FXS, CRV, CVX])
      const [fxsBefore, crvBefore, cvxBefore] = before.total_earned
      expect(fxsBefore).gt(0)
      expect(crvBefore).gt(0)
      expect(cvxBefore).gt(0)

      // when
      await increaseTimeIfNeeded(this.strategies[strategyIndex])
      const newStrategy = await createStrategy(this.strategies[strategyIndex], pool.address, { skipVault: true })
      await pool.connect(governor).migrateStrategy(strategy.address, newStrategy.address)

      // then
      const after = await vault.earned()
      const [fxsAfter, crvAfter, cvxAfter] = after.total_earned
      expect(fxsAfter).eq(0)
      expect(crvAfter).eq(0)
      expect(cvxAfter).eq(0)
    })
  })
}

module.exports = { shouldBehaveLikeConvexForFraxStrategy }
