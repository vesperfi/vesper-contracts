'use strict'

const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { expect } = require('chai')
const { deposit } = require('vesper-commons/utils/poolOps')
const { unlock } = require('vesper-commons/utils/setup')
const { ethers } = require('hardhat')
const { getChain, getChainData } = require('vesper-commons/utils/chains')
const { parseEther } = require('ethers/lib/utils')
const Address = getChainData().address

const { CRV } = Address.Curve

// crv strategy specific tests
function shouldBehaveLikeCrvStrategy(strategyIndex) {
  let strategy, user1, pool, collateralToken, crv
  describe('CurveStrategy specific tests', function () {
    beforeEach(async function () {
      ;[user1] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      crv = await ethers.getContractAt('ERC20', CRV)
    })

    it('Should get total value in LPs', async function () {
      await deposit(pool, collateralToken, 1, user1)
      await strategy.rebalance()
      const totalValue = await strategy.lpBalanceHereAndStaked()
      expect(totalValue).to.be.gt(0, 'Total tokens should be > zero')
    })

    // Note: Waiting clarification from Curve team to be able to simulate
    // multi-chain CRV reward distribution
    // Refs: https://curve.readthedocs.io/dao-gauges-sidechain.html
    if (getChain() === 'mainnet') {
      // TODO: Replace `estimateClaimableRewardsInCollateral` function
      // it('Should claim CRV when rebalance is called', async function () {
      //   await deposit(pool, collateralToken, 1, user1)
      //   await strategy.rebalance()
      //   await strategy.rebalance()
      //   await advanceBlock(1000)
      //   await strategy.setCheckpoint()
      //   const crvAccruedBefore = await strategy.callStatic.estimateClaimableRewardsInCollateral()
      //   await strategy.rebalance()
      //   const crvAccruedAfter = await strategy.callStatic.estimateClaimableRewardsInCollateral()
      //   expect(crvAccruedBefore).to.be.gt(0, 'crv accrued should be > 0 before rebalance')
      //   expect(crvAccruedAfter).to.be.equal(0, 'crv accrued should be 0 after rebalance')
      // })
    }

    it('Should liquidate CRV when claimed by external source', async function () {
      await deposit(pool, collateralToken, 1, user1)
      await strategy.rebalance()
      // Note: adjustBalance isn't working for CRV
      const crvHolder = await unlock('0x32d03db62e464c9168e41028ffa6e9a05d8c6451')
      await crv.connect(crvHolder).transfer(strategy.address, parseEther('10'))
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
      const stkAAVE = await ethers.getContractAt('ERC20', Address.Aave.stkAAVE, user1)

      // given
      await deposit(pool, collateralToken, 10, user1)
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
