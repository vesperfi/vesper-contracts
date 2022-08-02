'use strict'

const { makeNewStrategy, getStrategyToken } = require('vesper-commons/utils/setup')
const { deposit: _deposit, rebalanceStrategy, makeStrategyProfitable } = require('vesper-commons/utils/poolOps')
const { expect } = require('chai')
const { ethers } = require('hardhat')

async function shouldMigrateStrategies() {
  let pool, strategies, collateralToken
  let user1, user2, user3, gov

  async function deposit(amount, depositor) {
    return _deposit(pool, collateralToken, amount, depositor)
  }

  async function migrateAndAssert(oldStrategy, newStrategy) {
    await Promise.all([deposit(50, user2), deposit(30, user1)])
    await rebalanceStrategy(oldStrategy)
    const tvlBefore = await oldStrategy.instance.tvl()
    const strategyConfigBefore = await pool.strategy(oldStrategy.instance.address)
    const type = oldStrategy.type.toLowerCase()
    if (type.includes('vesper') && type.includes('xy')) {
      const borrowToken = await ethers.getContractAt('ERC20', await oldStrategy.instance.borrowToken())
      await makeStrategyProfitable(oldStrategy.instance, borrowToken)
    }
    await pool.connect(gov).migrateStrategy(oldStrategy.instance.address, newStrategy.instance.address)
    const tvlAfter = await newStrategy.instance.tvl()
    const strategyConfigAfter = await pool.strategy(newStrategy.instance.address)
    // Some strategies like curve, XY may bear loss on migrate. Lets assume maximum acceptable loss is 0.5%
    const expectedDelta = tvlBefore.mul(5).div(1000)
    expect(tvlAfter).to.be.closeTo(tvlBefore, expectedDelta, 'TVL of new strategy is wrong')
    expect(strategyConfigAfter._totalDebt).to.be.eq(strategyConfigBefore._totalDebt, 'Debt of new strategy is wrong')
  }

  async function assertDepositAndWithdraw(newStrategy) {
    await deposit(30, user2)
    const amountBefore = await pool.balanceOf(user2.address)
    expect(amountBefore).to.be.gt(0, 'failed to deposit in pool')
    await rebalanceStrategy(newStrategy)
    await pool.connect(user2).withdraw(amountBefore)
    const amountAfter = await pool.balanceOf(user2.address)
    expect(amountAfter).to.be.lt(amountBefore, "User's pool amount should decrease after withdraw")
  }

  async function assertTotalDebt(newStrategy) {
    await deposit(40, user3)
    await rebalanceStrategy(newStrategy)
    const totalDebtBefore = await pool.totalDebtOf(newStrategy.instance.address)
    await deposit(50, user3)
    await rebalanceStrategy(newStrategy)
    const totalDebtAfter = await pool.totalDebtOf(newStrategy.instance.address)
    expect(totalDebtAfter).to.be.gt(totalDebtBefore, 'Total debt of strategy is wrong')
  }

  async function strategyMigration(strategy) {
    const newStrategy = await makeNewStrategy(strategy, pool.address, { skipVault: true })
    const receiptToken = await getStrategyToken(strategy)
    await migrateAndAssert(strategy, newStrategy, receiptToken)
    await assertDepositAndWithdraw(newStrategy)
    await assertTotalDebt(newStrategy)
  }

  describe('Strategy Migration', function () {
    beforeEach(async function () {
      ;[gov, user1, user2, user3] = this.users
      pool = this.pool
      strategies = this.strategies
      collateralToken = this.collateralToken
    })

    it('Should be able to migrate strategy', async function () {
      for (const strategy of strategies) {
        await strategyMigration(strategy)
      }
    })
  })
}

module.exports = { shouldMigrateStrategies }
