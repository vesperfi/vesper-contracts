/* eslint-disable max-len */
'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { parseEther } = require('ethers/lib/utils')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { deposit } = require('vesper-commons/utils/poolOps')
const { unlock } = require('vesper-commons/utils/contractHelper')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { getChainData } = require('vesper-commons/utils/chains')

const Address = getChainData().address

const USDC_RESERVE_OLD_INTEREST_MODEL = 2
const USDC_RESERVE_NEW_INTEREST_MODEL = 25

// Extra Finance strategy specific tests
function shouldBehaveLikeExtraFinanceStrategy(strategyIndex) {
  let alice
  let pool, strategy, collateralToken, extraToken, lendingPool

  describe('Extra Finance specific tests', function () {
    beforeEach(async function () {
      ;[alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      extraToken = await ethers.getContractAt('ERC20', Address.ExtraFinance.EXTRA)
      lendingPool = await ethers.getContractAt('ILendingPool', await strategy.lendingPool())
    })

    it('Should claim EXTRA and swap to collateral', async function () {
      const reserveId = await strategy.reserveId()
      const { stakingAddress } = await lendingPool.reserves(reserveId)
      const strategySigner = await unlock(strategy.address)
      const staking = await ethers.getContractAt(
        'contracts/interfaces/extra-finance/IStakingRewards.sol:IStakingRewards',
        stakingAddress,
        strategySigner,
      )
      // No EXTRA rewards skip the test
      if ((await staking.rewardData(extraToken.address))[1] < (await time.latest())) {
        return
      }

      // given
      await deposit(pool, collateralToken, 100, alice)
      await strategy.rebalance()
      let earned = await staking.earned(strategy.address, extraToken.address)
      let claimable = await staking.userRewardsClaimable(strategy.address, extraToken.address)
      expect(earned).eq(0)
      expect(claimable).eq(0)
      await time.increase(time.duration.days(30))

      earned = await staking.earned(strategy.address, extraToken.address)
      expect(earned).gt(0)

      // when
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      // then
      claimable = await staking.userRewardsClaimable(strategy.address, extraToken.address)
      expect(claimable).eq(0)
      expect(await extraToken.balanceOf(strategy.address)).eq(0)
    })

    it('Should liquidate EXTRA when claimed by external source', async function () {
      const reserveId = await strategy.reserveId()
      const { stakingAddress } = await lendingPool.reserves(reserveId)
      const staking = await ethers.getContractAt(
        'contracts/interfaces/extra-finance/IStakingRewards.sol:IStakingRewards',
        stakingAddress,
      )
      // No EXTRA rewards meaning there may not be swap route, so skip the test
      if ((await staking.rewardPerToken(extraToken.address)) == 0) {
        return
      }

      // given
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      // Get some EXTRA at strategy address
      await adjustBalance(extraToken.address, strategy.address, parseEther('10'))
      expect(await extraToken.balanceOf(strategy.address)).gt(0)
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)

      // when
      await strategy.claimAndSwapRewards(amountOut)

      // then
      expect(await extraToken.balanceOf(strategy.address)).eq(0)
    })

    it('Should migrate funds to another reserve', async function () {
      const currentReserveId = await strategy.reserveId()
      if (currentReserveId != USDC_RESERVE_OLD_INTEREST_MODEL) {
        // This test case covers USDC only
        return
      }

      // given
      const { stakingAddress } = await lendingPool.reserves(currentReserveId)
      const currentStaking = await ethers.getContractAt(
        'contracts/interfaces/extra-finance/IStakingRewards.sol:IStakingRewards',
        stakingAddress,
      )
      await deposit(pool, collateralToken, 100, alice)
      await strategy.rebalance()

      const tvlBefore = await strategy.tvl()
      await time.increase(time.duration.days(30))
      const earned = await currentStaking.earned(strategy.address, extraToken.address)
      expect(earned).gt(0)

      // when
      const claimInCollateralAmountMin = 0
      await strategy.migrateReserve(USDC_RESERVE_NEW_INTEREST_MODEL, claimInCollateralAmountMin)

      // then
      expect(await strategy.reserveId()).eq(USDC_RESERVE_NEW_INTEREST_MODEL)
      const tvlAfter = await strategy.tvl()
      expect(tvlAfter).gt(tvlBefore) // expects TVL + rewards
      const claimable = await currentStaking.userRewardsClaimable(strategy.address, extraToken.address)
      expect(claimable).eq(0)
    })
  })
}

module.exports = { shouldBehaveLikeExtraFinanceStrategy }
