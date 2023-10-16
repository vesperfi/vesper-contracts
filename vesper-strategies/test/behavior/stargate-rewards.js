'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')

// Stargate rewards tests
function shouldTestStargateRewards(strategyIndex) {
  let strategy, pool, collateralToken
  let user1

  describe('Stargate rewards tests', function () {
    beforeEach(async function () {
      ;[, user1] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
    })

    it('Should swap rewardToken when claimed by external source', async function () {
      const rewardToken = await ethers.getContractAt('ERC20', await strategy.rewardToken(), user1)
      await deposit(pool, collateralToken, 10, user1)
      await strategy.rebalance()
      // Get some rewardToken at strategy address
      await adjustBalance(rewardToken.address, strategy.address, ethers.utils.parseEther('10'))
      expect(await rewardToken.balanceOf(strategy.address)).gt(0)
      const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
      await strategy.claimAndSwapRewards(amountOut)
      expect(await rewardToken.balanceOf(strategy.address)).eq(0)
    })
  })
}
module.exports = { shouldTestStargateRewards }
