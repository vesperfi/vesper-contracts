'use strict'

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
  describe('Curve specific tests', function () {
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
  })
}

module.exports = { shouldBehaveLikeCrvStrategy }
