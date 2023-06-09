'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const BigNumber = ethers.BigNumber
const { unlock } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')

function sanityTestOfPool(poolAddress) {
  let pool, accountant, governor
  let collateralToken
  let users

  const strategies = []

  beforeEach(async function () {
    pool = await ethers.getContractAt('VPool', poolAddress)
    governor = await unlock(await pool.governor())
    const _strategies = await pool.getStrategies()
    for (const _strategy of _strategies) {
      const instance = await ethers.getContractAt('IStrategy', _strategy)
      strategies.push(instance)
    }
    users = await ethers.getSigners()
    const collateralTokenAddress = await pool.token()
    collateralToken = await ethers.getContractAt('ERC20', collateralTokenAddress)
    accountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
  })

  it('Should deposit => rebalance => withdraw', async function () {
    let strategy
    for (const s of strategies) {
      const strategyConfig = await pool.strategy(s.address)
      if (strategyConfig._debtRatio.gt(BigNumber.from(0))) {
        strategy = s
        break
      }
    }
    // If all strategies has 0 debtRatio then strategy will be undefined
    if (!strategy) {
      strategy = strategies[0]
      await accountant.connect(governor).updateDebtRatio(strategy.address, 9000)
    }
    const keeperList = await strategy.keepers()
    const keeper = await unlock(keeperList[0])
    await strategy.connect(keeper).rebalance()
    await deposit(pool, collateralToken, 100, users[0])
    let balance = await pool.balanceOf(users[0].address)
    expect(balance).to.be.gt(0, 'Pool balance of user is wrong')
    const tokenHereBefore = await pool.tokensHere()
    await strategy.connect(keeper).rebalance()
    const tokensHereAfter = await pool.tokensHere()
    expect(tokenHereBefore).to.be.gt(tokensHereAfter, 'Rebalance ')
    await pool.connect(users[0]).withdraw(balance)
    balance = await pool.balanceOf(users[0].address)
    expect(balance).to.be.eq(0, 'Pool balance of user is wrong')
  })
}

// Commented test for CI build
// eslint-disable-next-line mocha/no-skipped-tests
xdescribe('Mainnet new pool sanity test', function () {
  const vaFEI = '0x2B6c40Ef15Db0D78D08A7D1b4E12d57E88a3e324'
  sanityTestOfPool(vaFEI)
  const vaDAI = '0x0538C8bAc84E95A9dF8aC10Aad17DbE81b9E36ee'
  sanityTestOfPool(vaDAI)
})
