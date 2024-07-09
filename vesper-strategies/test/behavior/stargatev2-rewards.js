'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')

// StargateV2 tests
function shouldTestStargateV2Rewards(strategyIndex) {
  let strategy, pool, collateralToken
  let user1

  describe('StargateV2 tests', function () {
    beforeEach(async function () {
      ;[, user1] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
    })

    async function getConvertRate() {
      const stargatePool = await ethers.getContractAt('IStargatePoolV2', await strategy.stargatePool())
      const stargateLp = await ethers.getContractAt('IERC20Metadata', await strategy.receiptToken())
      const localDecimals = await stargateLp.decimals()
      const sharedDecimals = await stargatePool.sharedDecimals()
      return 10 ** (localDecimals - sharedDecimals)
    }

    function getRandomDust(convertRate) {
      // If convertRate is one then 1e6 will be used
      const factor = convertRate === 1 ? 1e6 : convertRate
      // Make sure we have at most convertRate or 1e6 digits, anything below is dust.
      return ethers.BigNumber.from(Math.floor(Math.random() * factor))
    }

    // Deposits amount + randomDust and call rebalance
    async function testRebalance(amount) {
      const convertRate = await getConvertRate()
      const randomDust = getRandomDust(convertRate)
      // When amount is zero, deposit amount == randomDust
      const depositAmount = randomDust.add(amount)
      await adjustBalance(collateralToken.address, user1.address, depositAmount)
      await collateralToken.connect(user1).approve(pool.address, depositAmount)
      await pool.connect(user1)['deposit(uint256)'](depositAmount)
      await strategy.rebalance()
      const dustInStrategy = await collateralToken.balanceOf(strategy.address)

      if (convertRate === 1) {
        // There is should be no dust in strategy
        expect(dustInStrategy).eq(0)
      } else {
        const debtRatio = (await pool.strategy(strategy.address))._debtRatio
        // debtRatio is in basis point which is 10_000 based
        const dust = Math.floor((randomDust * debtRatio) / 10000)
        // There should be some dust in strategy
        expect(dustInStrategy).eq(dust)
      }
    }

    it('Should deposit amount which results in dust', async function () {
      const decimals = await collateralToken.decimals()
      const depositAmount = ethers.utils.parseUnits('10', decimals)
      await testRebalance(depositAmount)
    })

    it('Should not fail when deposit amount is below convertRate', async function () {
      await testRebalance('0')
    })

    it('Should swap rewardToken when claimed by external source', async function () {
      const rewardTokens = await strategy.getRewardTokens()
      const rewardToken = await ethers.getContractAt('ERC20', rewardTokens[0], user1)
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
module.exports = { shouldTestStargateV2Rewards }
