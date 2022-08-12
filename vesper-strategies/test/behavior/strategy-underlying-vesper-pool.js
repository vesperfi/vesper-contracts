'use strict'

const { deposit, rebalanceStrategy, rebalance } = require('vesper-commons/utils/poolOps')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const hre = require('hardhat')
const { BigNumber: BN } = require('ethers')
const { executeIfExist, unlock } = require('vesper-commons/utils/setup')
const { time } = require('@nomicfoundation/hardhat-network-helpers')

async function shouldBehaveLikeUnderlyingVesperPoolStrategy(strategyIndex) {
  let pool, strategy
  let collateralToken
  let user1, user2

  describe(`Underlying Vesper pool strategy specific tests[${strategyIndex}]`, function () {
    beforeEach(async function () {
      ;[, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex]
      collateralToken = this.collateralToken
    })

    describe('whitelisted withdraw', function () {
      beforeEach(async function () {
        await deposit(pool, collateralToken, 20, user1)
        await rebalanceStrategy(strategy)
      })

      it('Should not pay withdraw fee to underlying Vesper pool', async function () {
        await deposit(pool, collateralToken, 40, user2)
        await rebalance(this.strategies)
        const vPool = await ethers.getContractAt('VPool', await strategy.instance.receiptToken())
        const fc = '0xdba93b57e7223506717040f45d1ca3df5f30b275'
        const governor = await vPool.governor()
        const signer = await unlock(governor)
        const amount = BN.from(10).mul(BN.from('1000000000000000000'))
        await hre.network.provider.send('hardhat_setBalance', [governor, amount.toHexString()])
        await executeIfExist(vPool.connect(signer).updateFeeCollector, fc)
        await executeIfExist(vPool.connect(signer).updateWithdrawFee, '2000')
        const tokenBalanceBefore = await vPool.balanceOf(fc)
        await time.increase(10 * 24 * 60 * 60)
        await rebalance(this.strategies)
        const tokenBalanceAfter = await vPool.balanceOf(fc)
        expect(tokenBalanceAfter).to.be.eq(
          tokenBalanceBefore,
          'Strategy not setup correctly. Should not pay withdraw fee',
        )
      })
    })
  })
}

module.exports = { shouldBehaveLikeUnderlyingVesperPoolStrategy }
