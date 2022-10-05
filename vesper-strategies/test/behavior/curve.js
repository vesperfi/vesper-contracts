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
      it('Should claim CRV when rebalance is called (mainnet)', async function () {
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

        // when
        await strategy.rebalance()

        // then
        expect(await gauge.callStatic.claimable_tokens(strategy.address)).eq(0)
      })
    }

    it('Should liquidate CRV when claimed by external source', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      await adjustBalance(crv.address, strategy.address, parseEther('10'))
      expect(await crv.balanceOf(strategy.address)).to.be.gt(0, 'CRV balance should increase on strategy address')
      await strategy.rebalance()
      const crvBalance = await crv.balanceOf(strategy.address)
      expect(crvBalance).to.be.equal('0', 'CRV balance should be 0 on rebalance')
    })

    // Note: This test won't work because the `stkAAVE` rewards are inactive at the moment
    // To run this test properly, follow the steps below:
    // 1. Set `BLOCK_NUMBER` to `12420000`
    // 2. Comment `configureSwapper` and `configureOracles` in `setup.js`
    // 3. Comment `swapper.swapExactInput` call from `_claimRewardsAndConvertTo` function
    // 4. Change `_calculateAmountOutMin` function to return `0`
    // Changes are needed because of `MasterOracle` and `Swapper` weren't available on that old block
    it.skip('Should claim stkAAVE for aave pool', async function () {
      const stkAAVE = await ethers.getContractAt('ERC20', Address.Aave.stkAAVE, alice)

      // given
      await deposit(pool, collateralToken, 10, alice)
      await strategy.rebalance()
      await time.increase(time.duration.days(1))
      expect(await stkAAVE.balanceOf(strategy.address)).eq(0)

      // when
      await strategy.rebalance()
      expect(await stkAAVE.balanceOf(strategy.address)).gt(0)
    })
  })
}

module.exports = { shouldBehaveLikeCrvStrategy }
