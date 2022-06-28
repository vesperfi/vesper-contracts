'use strict'

const { setupStrategy } = require('./setup')
const { shouldBehaveLikeStrategy } = require('../behavior/strategy')
// const { shouldMigrateStrategies } = require('../behavior/strategy-migration')
const { getChain, getChainData } = require('vesper-commons/utils/chains')
const { ethers } = require('hardhat')
const { poolConfig, strategyConfig } = getChainData()

/**
 * @param {string} poolKey Vesper pool configuration key from poolConfig.js file
 * @param {string} strategyKey Strategy configuration keys from strategyConfig.js file
 * @param {object} strategyTestParam Object of strategy test params like debtRatio
 * @param {any} options Extra options like growToken
 */
function testRunner(poolKey, strategyKey, strategyTestParam = { debtRatio: 9000 }, options = {}) {
  const pool = poolConfig[poolKey]

  // Input sanitation
  if (!pool) {
    throw new Error(`${poolKey} configuration does not exist for ${getChain()}`)
  }

  // Read strategy configuration
  const strategy = strategyConfig[strategyKey]
  if (!strategy || !strategy.config) {
    throw new Error(`${strategyKey} configuration does not exit for ${getChain()} `)
  }
  // Read customized test params and set those in strategy configuration
  Object.keys(strategyTestParam).forEach(key => (strategy.config[key] = strategyTestParam[key]))

  // Do pool and strategy setup
  beforeEach(async function () {
    const users = await ethers.getSigners()
    this.users = users
    strategy.feeCollector = users[8].address
    await setupStrategy(this, strategy, options)
  })
  shouldBehaveLikeStrategy(strategy.type, strategy.contract)
  // TODO run this by default in strategy behavior
  // shouldMigrateStrategies(poolName)
}

module.exports = testRunner
