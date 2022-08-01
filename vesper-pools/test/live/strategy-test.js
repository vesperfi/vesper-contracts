/* eslint-disable no-console */
'use strict'
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { unlock } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')

function sanityTestOfAStrategy() {
  let pool, accountant
  let collateralToken
  let users, governor, governorSigner
  let vPoolTokenAddress, vPoolToken
  let borrowTokenAddress, borrowToken
  let borrowTokenBefore, vPoolTokenBefore

  // constant to change
  const poolAddress = '0x4Dbe3f01aBe271D3E65432c74851625a8c30Aa7B'
  const strategyAddress = '0xe27Da5cb6B63c25126452aCDe5D876dc80268B7A'
  const weight = 9800

  const feeCollector = '0x80d426D65D926dF121dc58C18D043B73e998CE2b'
  const strategyAbi = [
    'function addKeeper(address) external',
    'function borrowToken() external view returns(address)',
    'function feeCollector() external view returns(address)',
    'function NAME() external view returns(string)',
    'function rebalance() external',
    'function receiptToken() external view returns(address)',
    'function updateFeeCollector(address) external',
    'function vPool() external view returns(address)',
    'function totalLp() external view returns(uint256)',
    'function getLpValue(uint256) external view returns(uint256)',
  ]

  beforeEach(async function () {
    pool = await ethers.getContractAt('VPool', poolAddress)
    users = await ethers.getSigners()
    collateralToken = await ethers.getContractAt('TestVSP', await pool.token())
    governor = await pool.governor()
    governorSigner = await unlock(governor)
    accountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
  })

  it('Should deposit => rebalance => withdraw', async function () {
    console.log('price per share', (await pool.pricePerShare()).toString())
    const strategy = await ethers.getContractAt(strategyAbi, strategyAddress)
    const strategyName = await strategy.NAME()
    console.log('poolName ', await pool.name())
    console.log('strategyName ', strategyName)

    const keeper = await unlock(users[0].address)
    const currentFeeCollector = await strategy.feeCollector()
    if (currentFeeCollector.toLowerCase() !== feeCollector.toLowerCase()) {
      await strategy.connect(governorSigner).updateFeeCollector(feeCollector)
    }
    await strategy.connect(governorSigner).addKeeper(keeper.address)
    try {
      await accountant.connect(governorSigner).addStrategy(strategyAddress, 0, 0)
    } catch (e) {
      // ignore exception if strategy is already added.
    }

    console.log('availableCreditLimit', (await accountant.availableCreditLimit(strategyAddress)).toString())
    console.log('current debtRatio', (await accountant.strategy(strategy.address)).debtRatio.toString())
    await accountant.connect(governorSigner).updateDebtRatio(strategyAddress, weight)
    console.log('new debtRatio', (await accountant.strategy(strategy.address)).debtRatio.toString())
    console.log('availableCreditLimit', (await accountant.availableCreditLimit(strategyAddress)).toString())

    await strategy.connect(keeper).rebalance()
    await deposit(pool, collateralToken, 100, users[1])
    const balance = await pool.balanceOf(users[1].address)
    expect(balance).to.be.gt(0, 'Pool balance of user is wrong')
    const tokenHereBefore = await pool.tokensHere()
    const receiptTokenAddress = await strategy.connect(keeper).receiptToken()
    const receiptToken = await ethers.getContractAt('IERC20', receiptTokenAddress)

    const receiptTokenBalanceBefore = await receiptToken.balanceOf(strategyAddress)
    console.log('receiptTokenBalanceBefore', receiptTokenBalanceBefore.toString())

    if (strategyName.includes('XY')) {
      vPoolTokenAddress = await strategy.connect(keeper).vPool()
      vPoolToken = await ethers.getContractAt('IERC20', vPoolTokenAddress)
      borrowTokenAddress = await strategy.connect(keeper).borrowToken()
      borrowToken = await ethers.getContractAt('IERC20', borrowTokenAddress)

      borrowTokenBefore = await borrowToken.balanceOf(strategyAddress)
      console.log('borrowTokenBefore', borrowTokenBefore.toString())
      vPoolTokenBefore = await vPoolToken.balanceOf(strategyAddress)
      console.log('vPoolTokenBefore', vPoolTokenBefore.toString())
    }

    await strategy.connect(keeper).rebalance()
    const receiptTokenBalanceAfter = await receiptToken.balanceOf(strategy.address)

    console.log('receiptTokenBalanceAfter', receiptTokenBalanceAfter.toString())
    expect(receiptTokenBalanceAfter).to.be.gt(receiptTokenBalanceBefore, 'receipt token balance is wrong')

    if (strategyName.includes('XY')) {
      const borrowTokenAfter = await borrowToken.balanceOf(strategyAddress)
      console.log('borrowTokenAfter', borrowTokenAfter.toString())
      expect(borrowTokenAfter).to.be.gt(borrowTokenBefore, 'borrow token balance is wrong')

      const vPoolTokenAfter = await vPoolToken.balanceOf(strategyAddress)
      console.log('vPoolTokenAfter', vPoolTokenAfter.toString())
      expect(vPoolTokenAfter).to.be.gt(vPoolTokenBefore, 'vPool token balance is wrong')
    }

    const tokensHereAfter = await pool.tokensHere()
    expect(tokenHereBefore).to.be.gt(tokensHereAfter, 'pool token here is wrong')
    const balanceBefore = await pool.balanceOf(users[1].address)
    console.log('Pool balance before withdraw', balanceBefore.toString())
    await pool.connect(users[1]).withdraw(balance)
    const balanceAfter = await pool.balanceOf(users[1].address)
    console.log('Pool balance after withdraw', balanceAfter.toString())
    expect(balanceAfter).to.be.lt(balanceBefore, 'Pool balance of user is wrong')

    const ppsBefore = await pool.pricePerShare()
    console.log('price per share before second rebalance', ppsBefore.toString())
    await deposit(pool, collateralToken, 1000, users[1])
    await strategy.connect(keeper).rebalance()
    await mine(100)
    const ppsAfter = await pool.pricePerShare()
    console.log('price per share after second rebalance', ppsAfter.toString())
  })
}

describe('Mainnet Strategy sanity test', function () {
  sanityTestOfAStrategy()
})
