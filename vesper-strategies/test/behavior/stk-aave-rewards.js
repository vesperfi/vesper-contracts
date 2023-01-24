'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')

const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')
const Address = require('vesper-commons/utils/chains').getChainData().address

async function testStkAaveRewards(pool, strategy, collateralToken) {
  const [, alice] = await ethers.getSigners()
  const stkAAVE = await ethers.getContractAt('ERC20', Address.Aave.stkAAVE, alice)

  // given
  await deposit(pool, collateralToken, 100, alice)
  await strategy.rebalance()
  expect(await stkAAVE.balanceOf(strategy.address)).eq(0)

  // Send some stkAAVE to strategy i.e. assume stkAAVE are claimed from protocol.
  await adjustBalance(stkAAVE.address, strategy.address, ethers.utils.parseEther('10'))

  // claim rewards. This should trigger stkAAVE cooldown.
  await strategy.claimAndSwapRewards(0)

  // Increase 10 days to finish cooldown and claim AAVE from stkAAVE
  await time.increase(time.duration.days(10))
  expect(await stkAAVE.balanceOf(strategy.address)).gt(0)

  // when claim and swap rewards
  // Claim Rewards from protocol. Also unstake AAVE from stkAAVE
  const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
  await strategy.claimAndSwapRewards(amountOut)

  // Verify no stkAAVE left in strategy
  expect(await stkAAVE.balanceOf(strategy.address)).eq(0)
}

// StkAave rewards tests
function shouldTestStkAaveRewards(strategyIndex) {
  let strategy, pool, collateralToken

  describe('StkAave rewards tests', function () {
    beforeEach(async function () {
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
    })

    it('Should claim stkAAVE and swap to collateral', async function () {
      await testStkAaveRewards(pool, strategy, collateralToken)
    })
  })
}
module.exports = { shouldTestStkAaveRewards, testStkAaveRewards }
