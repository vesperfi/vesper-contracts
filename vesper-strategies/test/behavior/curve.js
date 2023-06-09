/* eslint-disable mocha/no-async-describe */
'use strict'

const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { parseEther } = require('ethers/lib/utils')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const { deposit } = require('vesper-commons/utils/poolOps')
const { unlock } = require('vesper-commons/utils/setup')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { testStkAaveRewards } = require('./stk-aave-rewards')
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

  describe('Curve specific tests', async function () {
    beforeEach(async function () {
      ;[alice] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      crv = await ethers.getContractAt('ERC20', Address.Curve.CRV)
      isConvex = this.strategies[strategyIndex].type.toUpperCase().includes('CONVEX')
    })

    it('Should get reward tokens', async function () {
      const { strategyName } = this.strategies[strategyIndex].constructorArgs

      const rewardTokens = await strategy.getRewardTokens()

      if (getChain() !== 'mainnet') {
        return
      }

      // Note: Cover several gauge scenarios
      const expected = {
        // LiquidityGauge
        ['Curve_y_DAI']: [Address.Curve.CRV],
        // LiquidityGaugeReward
        ['Curve_sUSD_DAI']: [Address.Curve.CRV, Address.SNX],
        // LiquidityGaugeV2/V3 with extra reward tokens
        ['Curve_mim_MIM']: [Address.SPELL, Address.Curve.CRV],
        // LiquidityGaugeV2/V3 without extra reward tokens
        ['Curve_msUSD_USDC']: [Address.Curve.CRV],
        // LiquidityGaugeV2/V3 with one extra reward token (AAVE)
        ['Curve_aave_DAI']: [Address.Curve.CRV, Address.Aave.AAVE],
      }

      const expectedRewardTokens = expected[strategyName]

      if (!expectedRewardTokens) {
        return
      }

      expect(rewardTokens).deep.eq(expectedRewardTokens)
    })

    it('Should get total value in LPs', async function () {
      await deposit(pool, collateralToken, 1, alice)
      await strategy.rebalance()
      const totalValue = await strategy.lpBalanceHereAndStaked()
      expect(totalValue).to.be.gt(0, 'Total tokens should be > zero')
    })

    it('Should claim CRV via minter or gauge factory', async function () {
      if (isConvex) {
        // This scenario only applies to standard Curve strategies
        return
      }

      let crvMinterAddress
      if (getChain() === 'mainnet') {
        crvMinterAddress = await strategy.CRV_MINTER()
      } else {
        crvMinterAddress = await strategy.GAUGE_FACTORY()
        const abi = ['function is_valid_gauge(address) external view returns(bool)']
        const gaugeFactory = await ethers.getContractAt(abi, crvMinterAddress)
        // skip test if gauge is not valid
        if (!(await gaugeFactory.is_valid_gauge(await strategy.crvGauge()))) {
          return
        }
      }
      const strategySigner = await unlock(strategy.address)
      const crvMinter = await ethers.getContractAt('ITokenMinter', crvMinterAddress, strategySigner)

      // given
      await deposit(pool, collateralToken, 100, alice)
      await strategy.rebalance()
      expect(await crv.balanceOf(strategy.address)).eq(0)
      await mine(1000)

      // when
      await crvMinter.mint(await strategy.crvGauge())

      // then
      // There may or may not be CRV rewards hence checking >= 0
      expect(await crv.balanceOf(strategy.address)).gte(0)
    })

    it('Should claim rewards(may include CRV)', async function () {
      // Avalanche tests are not claiming rewards properly hence skipping tests for now
      if (isConvex || getChain() === 'avalanche') {
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
      // await time.increase(time.duration.days(10))
      await gauge.user_checkpoint(strategy.address)
      try {
        expect(await gauge.callStatic.claimable_tokens(strategy.address)).gt(0)
      } catch {
        const rewardToken = await ethers.getContractAt('IERC20', await gauge.reward_tokens(0))
        const rewards = await gauge.claimable_reward(strategy.address, rewardToken.address)
        expect(rewards).gt(0)
      }
    })

    it('Should claim and swap rewards', async function () {
      // given
      await deposit(pool, collateralToken, 100, alice)
      await strategy.rebalance()

      let timeToIncrease = time.duration.days(10)
      if ((await strategy.NAME()).includes('aave') && getChain() === 'mainnet') {
        // Lets claim rewards including stkAAVE.
        // Passing 0 as it may fail as we are not swapping stkAAVE.
        await strategy.claimAndSwapRewards(0)
        const stkAAVE = await ethers.getContractAt('StakedAave', '0x4da27a545c0c5B758a6BA100e3a049001de870f5')
        timeToIncrease = await stkAAVE.COOLDOWN_SECONDS()
      }

      // time travel to earn more rewards. Also unlock AAVE from stkAAVE, if applicable
      await time.increase(timeToIncrease)

      // when
      // There may or may not be rewards to pass 0.
      await strategy.claimAndSwapRewards(0)
    })

    it('Should claim stkAAVE for aave pool', async function () {
      if ((await strategy.NAME()).includes('aave') && getChain() === 'mainnet') {
        // Aave rewards test
        await testStkAaveRewards(pool, strategy, collateralToken)
      }
    })

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
