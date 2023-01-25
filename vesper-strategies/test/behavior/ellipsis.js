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

// Ellipsis strategy specific tests
function shouldBehaveLikeEllipsisStrategy(strategyIndex) {
  let alice
  let pool, strategy, collateralToken, epx, receiptToken

  describe('Ellipsis specific tests', function () {
    beforeEach(async function () {
      ;[alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      epx = await ethers.getContractAt('ERC20', Address.Ellipsis.EPX)
      receiptToken = await strategy.token()
    })

    it('Should get total value in LPs', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      const totalValue = await strategy.lpBalanceHereAndStaked()
      expect(totalValue).to.be.gt(0, 'Total tokens should be > zero')
    })

    it('Should claim and swap EPX', async function () {
      const strategySigner = await unlock(strategy.address)
      const staking = await ethers.getContractAt('IEllipsisLpStaking', await strategy.LP_STAKING(), strategySigner)

      // given
      await deposit(pool, collateralToken, 100, alice)
      await strategy.rebalance()
      let claimable = (await staking.claimableReward(strategy.address, [receiptToken]))[0]
      expect(claimable).eq(0)
      await time.increase(24 * 60 * 60)

      claimable = (await staking.claimableReward(strategy.address, [receiptToken]))[0]
      expect(claimable).gt(0)

      // when
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      // then
      claimable = (await staking.claimableReward(strategy.address, [receiptToken]))[0]
      expect(claimable).eq(0)
      expect(await epx.balanceOf(strategy.address)).eq(0)
    })

    it('Should liquidate EPX when claimed by external source', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      // Get some EPX at strategy address
      await adjustBalance(epx.address, strategy.address, parseEther('10'))
      expect(await epx.balanceOf(strategy.address)).to.be.gt('0')
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      expect(await epx.balanceOf(strategy.address)).eq(0)
    })
  })
}

module.exports = { shouldBehaveLikeEllipsisStrategy }
