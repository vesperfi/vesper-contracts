'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { getChainData } = require('vesper-commons/utils/chains')
const { deposit } = require('vesper-commons/utils/poolOps')

const Address = getChainData().address

// DotDot strategy specific tests
function shouldBehaveLikeDotDotStrategy(strategyIndex) {
  const { Ellipsis, DotDot } = Address

  let pool, strategy, collateralToken
  let alice

  describe('Convex specific tests', function () {
    beforeEach(async function () {
      ;[, alice] = this.users
      pool = this.pool
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
      expect(await strategy.rewardTokens(0)).eq(Ellipsis.EPX)
      expect(strategy.rewardTokens(1)).revertedWithoutReason()

      // when
      await strategy.setRewardTokens([])

      // then
      // build expected tokens list (can't have duplicated items)
      const expected = [Ellipsis.EPX, DotDot.DDD]
      const lpDepositor = await ethers.getContractAt('ILpDepositor', await strategy.LP_DEPOSITOR())
      const lp = await strategy.token()
      const extraRewardsLength = (await lpDepositor.extraRewardsLength(lp)).toNumber()
      for (let i = 0; i < extraRewardsLength; ++i) {
        const extraRewardToken = lpDepositor.extraRewards(lp, i)
        if (extraRewardToken !== Ellipsis.EPX && extraRewardToken !== DotDot.DDD) {
          expected.push(extraRewardToken)
        }
      }
      for (let i = 0; i < expect.length; ++i) {
        expect(await strategy.rewardTokens(i)).eq(expected[i])
      }
    })

    it('Should claim all rewards during rebalance', async function () {
      const lpDepositor = await ethers.getContractAt('ILpDepositor', await strategy.LP_DEPOSITOR())
      const lp = await strategy.token()
      // given
      await deposit(pool, collateralToken, 10, alice)

      expect(await lpDepositor.userBalances(strategy.address, lp)).eq(0)
      await strategy.rebalance()
      expect(await lpDepositor.userBalances(strategy.address, lp)).gt(0)
      let claimable = (await lpDepositor.claimable(strategy.address, [lp]))[0]
      expect(claimable[0]).eq(0)
      expect(claimable[1]).eq(0)
      await time.increase(time.duration.days(1))
      claimable = (await lpDepositor.claimable(strategy.address, [lp]))[0]
      expect(claimable[0]).gt(0)
      expect(claimable[1]).gt(0)

      // when
      await strategy.rebalance()

      // then
      claimable = (await lpDepositor.claimable(strategy.address, [lp]))[0]
      expect(claimable[0]).eq(0)
      expect(claimable[1]).eq(0)
    })
  })
}

module.exports = { shouldBehaveLikeDotDotStrategy }
