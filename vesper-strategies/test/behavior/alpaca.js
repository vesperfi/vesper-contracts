'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { parseEther } = require('ethers/lib/utils')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { deposit } = require('vesper-commons/utils/poolOps')
const { unlock } = require('vesper-commons/utils/setup')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { getChainData } = require('vesper-commons/utils/chains')

const Address = getChainData().address

// Alpaca strategy specific tests
function shouldBehaveLikeAlpacaStrategy(strategyIndex) {
  let alice
  let pool, strategy, collateralToken, alpacaToken

  describe('Alpaca specific tests', function () {
    beforeEach(async function () {
      ;[alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      alpacaToken = await ethers.getContractAt('ERC20', Address.Alpaca.ALPACA)
    })

    it('Should get total staked in LPs', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      const totalValue = await strategy.getStakedLp()
      expect(totalValue).to.be.gt(0, 'Total staked tokens should be > zero')
    })

    it('Should claim ALPACA and swap to collateral', async function () {
      const strategySigner = await unlock(strategy.address)
      const fairLaunch = await ethers.getContractAt('IFairLaunch', await strategy.fairLaunch(), strategySigner)
      const poolId = await strategy.poolId()
      // Return if no rewards
      if ((await fairLaunch.poolInfo(poolId)).allocPoint == 0) {
        return
      }
      // given
      await deposit(pool, collateralToken, 100, alice)
      await strategy.rebalance()
      let claimable = await fairLaunch.pendingAlpaca(poolId, strategy.address)
      expect(claimable).eq(0)
      await time.increase(time.duration.days(1))

      claimable = await fairLaunch.pendingAlpaca(poolId, strategy.address)
      expect(claimable).gt(0)

      // when
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      // then
      claimable = await fairLaunch.pendingAlpaca(poolId, strategy.address)
      expect(claimable).eq(0)
      expect(await alpacaToken.balanceOf(strategy.address)).eq(0)
    })

    it('Should liquidate ALPACA when claimed by external source', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      // Get some ALPACA at strategy address
      await adjustBalance(alpacaToken.address, strategy.address, parseEther('10'))
      expect(await alpacaToken.balanceOf(strategy.address)).gt(0)
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      expect(await alpacaToken.balanceOf(strategy.address)).eq(0)
    })
  })
}

module.exports = { shouldBehaveLikeAlpacaStrategy }
