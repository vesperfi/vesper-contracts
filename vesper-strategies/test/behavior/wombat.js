'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { getChainData } = require('vesper-commons/utils/chains')
const { deposit } = require('vesper-commons/utils/poolOps')

const Address = getChainData().address

// Wombat strategy specific tests
function shouldBehaveLikeWombatStrategy(strategyIndex) {
  const { Wombat } = Address

  let pool, strategy, collateralToken
  let alice

  describe('Wombat specific tests', function () {
    beforeEach(async function () {
      ;[, alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
    })

    it('Should get staked LPs', async function () {
      // given
      await deposit(pool, collateralToken, 1, alice)
      expect(await strategy.getStakedLp()).eq(0)
      // when
      await strategy.rebalance()
      // then
      expect(await strategy.getStakedLp()).gt(0)
    })

    it('Should claim and swap all reward tokens', async function () {
      const masterWombat = await ethers.getContractAt('IMasterWombat', await strategy.masterWombat())
      const rewardTokens = await strategy.getRewardTokens()
      expect(rewardTokens[0]).eq(Wombat.WOM)
      const womb = await ethers.getContractAt('ERC20', rewardTokens[0])
      const pid = await strategy.wombatPoolId()

      // given
      await deposit(pool, collateralToken, 10, alice)
      // Verify lp is staked
      expect(await strategy.getStakedLp()).eq(0)
      await strategy.rebalance()
      expect(await strategy.getStakedLp()).gt(0)

      // verify claimable is zero
      let pendingTokens = await masterWombat.pendingTokens(pid, strategy.address)
      expect(pendingTokens.pendingRewards).eq(0)
      if (pendingTokens.pendingBonusRewards.length > 0) {
        pendingTokens.pendingBonusRewards.forEach(rewards => expect(rewards).eq(0))
      }
      // Increase time to earn rewards
      await time.increase(time.duration.days(1))

      // Read pendingTokens again and verify claimable is non zero
      pendingTokens = await masterWombat.pendingTokens(pid, strategy.address)
      expect(pendingTokens.pendingRewards).gt(0)
      if (pendingTokens.pendingBonusRewards.length > 0) {
        // Not all bonus rewards are > 0
        expect(pendingTokens.pendingBonusRewards.some(rewards => rewards.gt(0))).true
      }

      // when
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      // then claimable should be zero
      // Read pendingTokens again
      pendingTokens = await masterWombat.pendingTokens(pid, strategy.address)
      expect(pendingTokens.pendingRewards).eq(0)
      if (pendingTokens.pendingBonusRewards.length > 0) {
        pendingTokens.pendingBonusRewards.forEach(rewards => expect(rewards).eq(0))
      }

      // then reward token balance should be zero.
      expect(await womb.balanceOf(strategy.address)).eq(0)
    })

    it('Should claim and swap when refreshing reward tokens', async function () {
      const masterWombat = await ethers.getContractAt('IMasterWombat', await strategy.masterWombat())
      const pid = await strategy.wombatPoolId()

      // given, there is reward token, deposit and rebalance done
      const rewardTokens = await strategy.getRewardTokens()
      expect(rewardTokens[0]).eq(Wombat.WOM)
      const womb = await ethers.getContractAt('ERC20', rewardTokens[0])
      await deposit(pool, collateralToken, 10, alice)
      await strategy.rebalance()
      // increase time to earn reward
      await time.increase(time.duration.days(1))
      let pendingTokens = await masterWombat.pendingTokens(pid, strategy.address)
      expect(pendingTokens.pendingRewards).gt(0)

      // when
      await strategy.refreshRewardTokens()

      // then
      pendingTokens = await masterWombat.pendingTokens(pid, strategy.address)
      expect(pendingTokens.pendingRewards).eq(0)
      expect(await womb.balanceOf(strategy.address)).eq(0)
    })
  })
}

module.exports = { shouldBehaveLikeWombatStrategy }
