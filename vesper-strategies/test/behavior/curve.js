'use strict'

const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { parseEther } = require('ethers/lib/utils')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const { deposit } = require('vesper-commons/utils/poolOps')
const { unlock } = require('vesper-commons/utils/setup')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { getChain, getChainData } = require('vesper-commons/utils/chains')

const Address = getChainData().address

// crv strategy specific tests
function shouldBehaveLikeCrvStrategy(strategyIndex) {
  let alice
  let pool
  let strategy
  let collateralToken
  let crv
  let isConvex

  describe('Curve specific tests', function () {
    beforeEach(async function () {
      ;[alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      crv = await ethers.getContractAt('ERC20', Address.Curve.CRV)
      isConvex = this.strategies[strategyIndex].type.toUpperCase().includes('CONVEX')
    })

    it('Should get total value in LPs', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      const totalValue = await strategy.lpBalanceHereAndStaked()
      expect(totalValue).to.be.gt(0, 'Total tokens should be > zero')
    })

    // Note: Waiting clarification from Curve team to be able to simulate
    // multi-chain CRV reward distribution
    // Refs: https://curve.readthedocs.io/dao-gauges-sidechain.html
    if (getChain() === 'mainnet') {
      it('Should claim CRV (mainnet)', async function () {
        if (isConvex) {
          // This scenario only applies to standard Curve strategies
          return
        }

        const strategySigner = await unlock(strategy.address)
        const gauge = await ethers.getContractAt('ILiquidityGaugeV3', await strategy.crvGauge(), strategySigner)

        // given
        await deposit(pool, collateralToken, 100, alice)
        await strategy.rebalance()
        expect(await gauge.callStatic.claimable_tokens(strategy.address)).eq(0)
        await mine(1000)
        await gauge.user_checkpoint(strategy.address)
        expect(await gauge.callStatic.claimable_tokens(strategy.address)).gt(0)

        if ((await strategy.NAME()).includes('aave')) {
          // Lets claim rewards including stkAAVE.
          // Passing 0 as it may fail as we are not swapping stkAAVE.
          await strategy.claimAndSwapRewards(0)
        }

        // time travel to earn more rewards. Also unlock AAVE from stkAAVE, if applicable
        await time.increase(time.duration.days(10))

        // when
        const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
        await strategy.claimAndSwapRewards(amountOut)

        // then
        expect(await gauge.callStatic.claimable_tokens(strategy.address)).eq(0)
      })

      it('Should claim stkAAVE for aave pool', async function () {
        if (!(await strategy.NAME()).includes('aave')) {
          return
        }
        const stkAAVE = await ethers.getContractAt('ERC20', Address.Aave.stkAAVE, alice)
        // given
        await deposit(pool, collateralToken, 100, alice)
        await strategy.rebalance()
        expect(await stkAAVE.balanceOf(strategy.address)).eq(0)

        // Send some stkAAVE to strategy i.e. assume stkAAVE are claimed from Curve.
        await adjustBalance(stkAAVE.address, strategy.address, ethers.utils.parseEther('10'))

        // claim rewards. This should trigger stkAAVE cooldown.
        await strategy.claimAndSwapRewards(0)

        // Increase 10 days to finish cooldown and claim AAVE from stkAAVE
        await time.increase(time.duration.days(10))
        expect(await stkAAVE.balanceOf(strategy.address)).gt(0)

        // when claim and swap rewards
        // Claim Rewards from Curve. Also unstake AAVE from stkAAVE
        const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
        await strategy.claimAndSwapRewards(amountOut)

        // Verify no stkAAVE left in strategy
        expect(await stkAAVE.balanceOf(strategy.address)).eq(0)
      })
    }

    it('Should liquidate CRV when claimed by external source', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      await adjustBalance(crv.address, strategy.address, parseEther('10'))
      expect(await crv.balanceOf(strategy.address)).to.be.gt(0, 'CRV balance should increase on strategy address')
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)

      const crvBalance = await crv.balanceOf(strategy.address)
      expect(crvBalance).to.be.equal('0', 'CRV balance should be 0 on rebalance')
    })
  })
}

module.exports = { shouldBehaveLikeCrvStrategy }
