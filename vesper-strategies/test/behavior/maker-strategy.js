'use strict'

const { deposit } = require('../utils/poolOps')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const address = require('vesper-commons/config/mainnet/address')
const { executeIfExist, getStrategyToken } = require('../utils/setup')
const { shouldValidateMakerCommonBehavior } = require('./maker-common')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { BigNumber } = require('ethers')

function shouldBehaveLikeMakerStrategy(index) {
  let pool, strategy, token, accountant
  let collateralToken, cm
  let user1, user2

  async function updateRate() {
    await executeIfExist(token.exchangeRateCurrent)
    // Update rate using Jug drip
    const jugLike = await ethers.getContractAt('JugLike', '0x19c0976f590D67707E62397C87829d896Dc0f1F1')
    const vaultType = await strategy.collateralType()
    await jugLike.drip(vaultType)
  }
  shouldValidateMakerCommonBehavior(index)
  describe('MakerStrategy specific tests', function () {
    beforeEach(async function () {
      ;[, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[index].instance
      accountant = this.accountant
      collateralToken = this.collateralToken
      token = await getStrategyToken(this.strategies[index])
      cm = await ethers.getContractAt('ICollateralManager', await strategy.cm())
    })

    describe('Earning scenario', function () {
      beforeEach(async function () {
        await deposit(pool, collateralToken, 30, user1)
        await strategy.rebalance()
      })

      it('Should report profit when there is DAI earning', async function () {
        await deposit(pool, collateralToken, 40, user2)
        await strategy.rebalance()
        const ppsBefore = await pool.pricePerShare()
        await adjustBalance(address.DAI, strategy.address, ethers.utils.parseUnits('1000', 18))
        const data = await strategy.callStatic.rebalance()
        expect(data._profit).to.be.gt(0, 'Should have some profit')
        expect(data._loss).to.be.equal(0, 'Should have no loss')
        await strategy.rebalance()
        const ppsAfter = await pool.pricePerShare()
        expect(ppsAfter).to.be.gt(ppsBefore, 'Collateral token in pool should increase')
        const tokenBalanceBefore = await token.balanceOf(strategy.address)
        await strategy.rebalance()
        const tokenBalanceAfter = await token.balanceOf(strategy.address)
        expect(tokenBalanceAfter).to.be.gt(tokenBalanceBefore, 'Should increase dai balance in aave maker strategy')
      })

      it('Should borrow more dai when strategy get more fund from pool', async function () {
        await deposit(pool, collateralToken, 50, user2)
        await strategy.rebalance()
        const daiDebtBefore = await cm.getVaultDebt(strategy.address)
        await deposit(pool, collateralToken, 50, user2)
        await updateRate()
        await strategy.rebalance()
        const daiDebtAfter = await cm.getVaultDebt(strategy.address)
        expect(daiDebtAfter).to.be.gt(daiDebtBefore, 'Should increase vault debt on rebalance')
      })

      it('Should payback all when debt ratio set 0', async function () {
        await deposit(pool, collateralToken, 150, user2)
        await strategy.rebalance()
        await accountant.updateDebtRatio(strategy.address, 0)
        await strategy.resurface()
        await strategy.rebalance()
        const daiDebtAfter = await cm.getVaultDebt(strategy.address)
        expect(daiDebtAfter).to.be.eq(0, 'Should have 0 debt')
      })

      it('Should payback when low water', async function () {
        await deposit(pool, collateralToken, 150, user2)
        await strategy.rebalance()
        let highWater = await strategy.highWater()
        const WAT = BigNumber.from('10000000000000000')
        highWater = highWater.div(WAT)
        const lw = highWater.add(BigNumber.from('10'))
        const hw = lw.add(BigNumber.from('10'))
        const daiDebtBefore = await cm.getVaultDebt(strategy.address)
        await strategy.updateBalancingFactor(hw, lw)
        highWater = await strategy.highWater()
        await strategy.rebalance()
        const daiDebtAfter = await cm.getVaultDebt(strategy.address)
        expect(daiDebtAfter).to.be.lt(daiDebtBefore, 'Should decrease vault debt when low water')
      })
    })
  })
}

module.exports = { shouldBehaveLikeMakerStrategy }
