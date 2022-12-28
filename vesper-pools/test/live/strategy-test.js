/* eslint-disable no-console */
'use strict'
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { unlock } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')
const { mine, time } = require('@nomicfoundation/hardhat-network-helpers')
const { getChainData } = require('vesper-commons/utils/chains')
const Address = getChainData().address
const decimal = 18 // vesper uses 18 digits

// constant to change
const poolAddress = '0xa8b607Aa09B6A2E306F93e74c282Fb13f6A80452'
const strategyAddress = '0xeE44D248248E1b0bBE313003a41016db004326EB'
const weight = 100 // 1%

let strategy, keeper, accountant, collateralDecimal

async function rebalance() {
  mine(100)
  await time.increase(200 * 60 * 60)
  let result = await strategy.connect(keeper).callStatic.rebalance()
  await strategy.connect(keeper).rebalance()
  const profit = ethers.utils.formatUnits(result[0], collateralDecimal)
  const loss = ethers.utils.formatUnits(result[1], collateralDecimal)
  const payback = ethers.utils.formatUnits(result[2], collateralDecimal)
  const totalDebt = ethers.utils.formatUnits((await accountant.strategy(strategy.address)).totalDebt, collateralDecimal)
  console.log(`Rebalance: profit: ${profit}, loss: ${loss}, payback: ${payback}, totalDebt: ${totalDebt}`)
}

async function setupOracle() {
  const masterOracleABI = [
    'function defaultOracle() external view returns(address)',
    'function oracles(address) external view returns (address)',
    'function updateTokenOracle(address,address) external',
    'function addressProvider() external view returns(address)',
  ]
  const defaultOracleABI = [
    'function updateDefaultStalePeriod(uint256)',
    'function updateCustomStalePeriod(address,uint256)',
  ]
  const addressProviderABI = ['function governor() view returns(address)']
  const masterOracle = await ethers.getContractAt(masterOracleABI, Address.Vesper.MasterOracle)
  const defaultOracle = await ethers.getContractAt(defaultOracleABI, await masterOracle.defaultOracle())
  const addressProvider = await ethers.getContractAt(addressProviderABI, await masterOracle.addressProvider())
  const governor = await unlock(await addressProvider.governor())
  await defaultOracle.connect(governor).updateCustomStalePeriod(Address.DAI, ethers.constants.MaxUint256)
  await defaultOracle.connect(governor).updateCustomStalePeriod(Address.USDC, ethers.constants.MaxUint256)
  await defaultOracle.connect(governor).updateCustomStalePeriod(Address.FRAX, ethers.constants.MaxUint256)
}

function sanityTestOfAStrategy() {
  let pool
  let collateralToken
  let users, governor, governorSigner
  let vPoolTokenAddress, vPoolToken
  let borrowTokenAddress, borrowToken
  let borrowTokenBefore, vPoolTokenBefore

  const feeCollector = '0x80d426D65D926dF121dc58C18D043B73e998CE2b'
  const strategyAbi = [
    'function addKeeper(address) external',
    'function borrowToken() external view returns(address)',
    'function feeCollector() external view returns(address)',
    'function NAME() external view returns(string)',
    'function rebalance() external returns(uint256,uint256,uint256)',
    'function receiptToken() external view returns(address)',
    'function updateFeeCollector(address) external',
    'function vPool() external view returns(address)',
    'function totalLp() external view returns(uint256)',
    'function getLpValue(uint256) external view returns(uint256)',
    'function updateBorrowRatio(uint256, uint256) external',
  ]

  beforeEach(async function () {
    pool = await ethers.getContractAt('VPool', poolAddress)
    users = await ethers.getSigners()
    collateralToken = await ethers.getContractAt('TestVSP', await pool.token())
    collateralDecimal = await collateralToken.decimals()
    governor = await pool.governor()
    governorSigner = await unlock(governor)
    accountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
    await setupOracle()
  })

  it('Should deposit => rebalance => withdraw', async function () {
    strategy = await ethers.getContractAt(strategyAbi, strategyAddress)
    const strategyName = await strategy.NAME()
    console.log('poolName ', await pool.name())
    console.log('strategyName ', strategyName)

    keeper = await unlock(users[0].address)
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
    console.log('Initial pps', ethers.utils.formatUnits(await pool.pricePerShare(), collateralDecimal))
    const currentWeight = (await accountant.strategy(strategy.address)).debtRatio.toString()
    console.log('Current strategy weight (debtRatio):', currentWeight)
    if (currentWeight === '0') {
      await accountant.connect(governorSigner).updateDebtRatio(strategyAddress, weight)
    }
    console.log(
      'availableCreditLimit',
      ethers.utils.formatUnits(await accountant.availableCreditLimit(strategyAddress), collateralDecimal),
    )
    console.log('First rebalance')
    await rebalance()
    const amount = 1000
    console.log('pps after first rebalance', ethers.utils.formatUnits(await pool.pricePerShare(), collateralDecimal))
    console.log(`Deposit ${amount} tokens`)
    await deposit(pool, collateralToken, amount, users[1])
    const balance = await pool.balanceOf(users[1].address)
    expect(balance).to.be.gt(0, 'Pool balance of user is wrong')

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
    console.log('Rebalance after deposit')
    await rebalance()
    console.log('pps after second rebalance', ethers.utils.formatUnits(await pool.pricePerShare(), collateralDecimal))

    if (strategyName.includes('XY')) {
      const borrowTokenAfter = await borrowToken.balanceOf(strategyAddress)
      console.log('borrowTokenAfter', borrowTokenAfter.toString())
      expect(borrowTokenAfter).to.be.gt(borrowTokenBefore, 'borrow token balance is wrong')

      const vPoolTokenAfter = await vPoolToken.balanceOf(strategyAddress)
      console.log('vPoolTokenAfter', vPoolTokenAfter.toString())
      expect(vPoolTokenAfter).to.be.gt(vPoolTokenBefore, 'vPool token balance is wrong')
    }

    let balanceBefore = await pool.balanceOf(users[1].address)
    console.log('Withdraw user full amount')
    console.log('pps before withdraw', ethers.utils.formatUnits(await pool.pricePerShare(), collateralDecimal))
    await pool.connect(users[1]).withdraw(balance)
    let balanceAfter = await pool.balanceOf(users[1].address)
    expect(balanceBefore).to.be.gt(balanceAfter, 'withdraw failed.')
    console.log(
      `User Pool balance before withdraw: ${ethers.utils.formatUnits(
        balanceBefore,
        decimal,
      )} after withdraw: ${ethers.utils.formatUnits(balanceAfter, decimal)}`,
    )
    expect(balanceAfter).to.be.lt(balanceBefore, 'Pool balance of user is wrong')
    console.log('pps after withdraw', ethers.utils.formatUnits(await pool.pricePerShare(), collateralDecimal))
    console.log(`Deposit again ${amount} tokens`)
    console.log('Rebalance after withdraw and then deposit')
    await deposit(pool, collateralToken, amount, users[1])
    console.log(
      'availableCreditLimit',
      ethers.utils.formatUnits(await accountant.availableCreditLimit(strategyAddress), collateralDecimal),
    )
    await rebalance()
    console.log(
      'pps after withdraw and deposit',
      ethers.utils.formatUnits(await pool.pricePerShare(), collateralDecimal),
    )

    console.log('Change weight (debtRatio) to 0.01% for the strategy')
    await accountant.connect(governorSigner).updateDebtRatio(strategyAddress, 1) // 0.01%
    console.log('New weight (debtRatio)', (await accountant.strategy(strategy.address)).debtRatio.toString())
    balanceBefore = await pool.balanceOf(users[1].address)
    console.log('Withdraw user full amount')
    await pool.connect(users[1]).withdraw(balanceBefore)
    balanceAfter = await pool.balanceOf(users[1].address)
    expect(balanceBefore).to.be.gt(balanceAfter, 'withdraw failed.')
    console.log(
      `User Pool balance before withdraw: ${ethers.utils.formatUnits(
        balanceBefore,
        decimal,
      )} after withdraw: ${ethers.utils.formatUnits(balanceAfter, decimal)}`,
    )
    console.log('Final rebalance')
    await rebalance()
  })
}

describe('Mainnet Strategy sanity test', function () {
  sanityTestOfAStrategy()
})
