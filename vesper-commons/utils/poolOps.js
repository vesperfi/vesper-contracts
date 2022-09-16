/* eslint-disable complexity */
'use strict'

const hre = require('hardhat')
const ethers = hre.ethers
const { BigNumber } = require('ethers')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const { adjustBalance } = require('./balance')
const { getChain } = require('./chains')
const { unlock, executeIfExist, getStrategyToken } = require('./setup')
const address = require(`../config/${getChain()}/address`)

/**
 *  Swap given ETH for given token type and deposit tokens into Vesper pool
 *
 * @param {object} pool Vesper pool instance where we want to deposit tokens
 * @param {object} token Collateral token instance, the token you want to deposit
 * @param {number|string} amount Amount to deposit. Eg 100 for 100 DAI
 * @param {object} depositor User who is depositing in Vesper pool
 * @returns {Promise<BigNumber>} Promise of collateral amount which was deposited in Vesper pool
 */
async function deposit(pool, token, amount, depositor) {
  const parsedAmount = ethers.utils.parseUnits(amount.toString(), await token.decimals())
  await adjustBalance(token.address, depositor.address, parsedAmount)
  const depositAmount = await token.balanceOf(depositor.address)
  await token.connect(depositor).approve(pool.address, depositAmount)
  await pool.connect(depositor)['deposit(uint256)'](depositAmount)
  return depositAmount
}

/**
 * Make strategy profitable by increasing given token balance in given strategy.
 *
 * @param {object} strategy Strategy instance
 * @param {object} token Balance will be updated for this token
 * @param {object``} token2 Optional token for balance update
 */
async function makeStrategyProfitable(strategy, token, token2 = {}) {
  const balance = await token.balanceOf(strategy.address)
  const increaseBalanceBy = ethers.utils.parseUnits('200', await token.decimals())
  try {
    // Do not fail if adjust balance fails on first token.
    await adjustBalance(token.address, strategy.address, balance.add(increaseBalanceBy))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error while making strategy profitable', e)
  }
  // Adjust balance of token 2 if provided
  if (token2.address) {
    await adjustBalance(token2.address, strategy.address, balance.add(increaseBalanceBy))
  }
}

/**
 * Rebalance one strategy
 *
 * @param {object} strategy - strategy object
 */
async function rebalanceStrategy(strategy) {
  // Alpha SafeBox has a cToken - this method calls exchangeRateCurrent on the cToken
  await executeIfExist(strategy.instance.updateTokenRate)

  // For Compound related strategies
  const token = await getStrategyToken(strategy)
  await executeIfExist(token.accrueInterest)

  return strategy.instance.rebalance()
}

/**
 * rebalance in all strategies.
 *
 * @param {Array} strategies - list of strategies
 */
async function rebalance(strategies) {
  const txs = []
  for (const strategy of strategies) {
    const tx = await rebalanceStrategy(strategy)
    txs.push(tx)
  }
  return txs
}

// It will be useful for Vesper strategy if we use real Vesper pool
async function rebalanceUnderlying(strategy) {
  const vPool = await ethers.getContractAt('VPool', await strategy.vPool())
  const accountant = await ethers.getContractAt('PoolAccountant', await vPool.poolAccountant())
  const strategies = await accountant.getStrategies()

  const keeper = await unlock(address.Vesper.KEEPER)
  const promises = []
  for (const underlyingStrategy of strategies) {
    if ((await accountant.totalDebtOf(underlyingStrategy)).gt(0)) {
      const strategyObj = await ethers.getContractAt('IStrategy', underlyingStrategy)
      promises.push(strategyObj.connect(keeper).rebalance())
    }
  }
  return Promise.all(promises)
}

/**
 * Calculate and return total debt of all strategies
 * @param {object[]} strategies Array of strategy
 * @param {object} pool Pool instance
 * @returns {Promise<BigNumber>} totalDebt
 */
async function totalDebtOfAllStrategy(strategies, pool) {
  let totalDebt = BigNumber.from(0)
  for (const strategy of strategies) {
    const strategyTotalDebt = await pool.totalDebtOf(strategy.instance.address)
    totalDebt = totalDebt.add(strategyTotalDebt)
  }
  return totalDebt
}

/**
 * Increase block.time to the point where withdraw is allowed
 * It's used for strategies that funds are locked for some period of time (e.g. ConvexForFrax)
 * @param {object} strategy - strategy object
 */
async function increaseTimeIfNeeded(strategy) {
  const c = new ethers.Contract(
    strategy.instance.address,
    ['function unlockTime() view returns (uint256)'],
    ethers.provider,
  )
  try {
    const unlockTime = await c.unlockTime()
    if (unlockTime > 0) {
      await time.increaseTo(unlockTime)
    }
  } catch (e) {
    // fail silently because not all strategies have such function
  }
}

module.exports = {
  deposit,
  rebalance,
  rebalanceStrategy,
  rebalanceUnderlying,
  totalDebtOfAllStrategy,
  makeStrategyProfitable,
  increaseTimeIfNeeded,
}
