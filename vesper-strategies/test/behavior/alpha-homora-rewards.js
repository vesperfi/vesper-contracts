'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')
const Address = require('vesper-commons/utils/chains').getChainData().address

// Alpha Homora rewards tests
function shouldTestAlphaHomoraRewards(strategyIndex) {
  let strategy, pool, collateralToken
  let user1

  describe('Alpha Homora rewards tests', function () {
    beforeEach(async function () {
      ;[, user1] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
    })

    it('Should swap ALPHA rewards when claimed by external source', async function () {
      const alpha = await ethers.getContractAt('ERC20', Address.Alpha.ALPHA, user1)
      await deposit(pool, collateralToken, 10, user1)
      await strategy.rebalance()
      // Get some ALPHA at strategy address
      await adjustBalance(alpha.address, strategy.address, ethers.utils.parseEther('10'))
      expect(await alpha.balanceOf(strategy.address)).gt(0)
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      expect(await alpha.balanceOf(strategy.address)).eq(0)
    })
  })
}
module.exports = { shouldTestAlphaHomoraRewards }
