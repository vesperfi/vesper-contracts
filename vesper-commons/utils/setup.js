'use strict'

const hre = require('hardhat')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const ethers = hre.ethers
const StrategyType = require('./strategyTypes')
const { adjustBalance } = require('./balance')
const { deployContract, executeIfExist, unlock } = require('./contractHelper')
const gemJoins = require('./gemJoins')
const { getChain, getChainData } = require('./chains')
const swapHelper = require('./swapHelper')
const chain = getChain()
const Address = getChainData().address
hre.address = Address

const MAX_UINT = ethers.constants.MaxUint256
// Contract names
const CToken = 'CToken'
const TokenLike = 'TokenLikeTest'
const CollateralManager = 'CollateralManager'
const PoolAccountant = 'PoolAccountant'

async function configureOracles(strategies) {
  for (const strategy of strategies) {
    const strategyType = strategy.type.toLowerCase()
    // NOTE:: CONVEX type is using value as curveConvex, hence can't use that value for comparison
    const curveLikeStrategies = [StrategyType.CURVE, 'convex', StrategyType.ELLIPSIS, StrategyType.DOT_DOT]
    if (curveLikeStrategies.some(value => strategyType.includes(value.toLowerCase()))) {
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
      const btcPeggedOracleABI = ['function updateDefaultStalePeriod(uint256)']
      const addressProviderABI = [
        'function governor() view returns(address)',
        'function stableCoinProvider() view returns (address)',
      ]
      const stableCoinProviderABI = ['function updateDefaultStalePeriod(uint256)']

      const masterOracle = await ethers.getContractAt(masterOracleABI, Address.Vesper.MasterOracle)
      const defaultOracle = await ethers.getContractAt(defaultOracleABI, await masterOracle.defaultOracle())
      const addressProvider = await ethers.getContractAt(addressProviderABI, await masterOracle.addressProvider())
      const governor = await unlock(await addressProvider.governor())
      const stableCoinProvider = await ethers.getContractAt(
        stableCoinProviderABI,
        await addressProvider.stableCoinProvider(),
      )

      await defaultOracle.connect(governor).updateDefaultStalePeriod(MAX_UINT)
      if (chain === 'mainnet') {
        const alUsdOracleABI = ['function updateDefaultStalePeriod(uint256)', 'function update()']
        const alUsdOracle = await ethers.getContractAt(alUsdOracleABI, await masterOracle.oracles(Address.ALUSD))
        const btcPeggedOracle = await ethers.getContractAt(btcPeggedOracleABI, Address.Vesper.BtcPeggedOracle)

        // Accepts outdated prices due to time travels
        await defaultOracle.connect(governor).updateCustomStalePeriod(Address.DAI, MAX_UINT)
        await defaultOracle.connect(governor).updateCustomStalePeriod(Address.USDC, MAX_UINT)
        await defaultOracle.connect(governor).updateCustomStalePeriod(Address.USDT, MAX_UINT)
        await defaultOracle.connect(governor).updateCustomStalePeriod(Address.FRAX, MAX_UINT)
        await defaultOracle.connect(governor).updateCustomStalePeriod(Address.sUSD, MAX_UINT)
        await stableCoinProvider.connect(governor).updateDefaultStalePeriod(MAX_UINT)
        await alUsdOracle.connect(governor).updateDefaultStalePeriod(MAX_UINT)
        await btcPeggedOracle.connect(governor).updateDefaultStalePeriod(MAX_UINT)

        // Ensure alUSD oracle is updated
        await alUsdOracle.update()
      } else if (chain === 'avalanche') {
        const btcPeggedOracle = await ethers.getContractAt(btcPeggedOracleABI, Address.Vesper.BtcPeggedOracle)
        // Accepts outdated prices due to time travels
        await stableCoinProvider.connect(governor).updateDefaultStalePeriod(MAX_UINT)
        await btcPeggedOracle.connect(governor).updateDefaultStalePeriod(MAX_UINT)
      }

      // Setup is needed just once
      break
    }
  }
}

/**
 * Add all strategies in pool
 *
 * @param {object} obj Updated test class object
 */
async function addStrategies(obj) {
  for (const strategy of obj.strategies) {
    await obj.accountant.addStrategy(strategy.instance.address, ...Object.values(strategy.config))
  }
}

/**
 * Setups a local Vesper Pool for strategies that use it as underlying
 *
 * @param {string} collateralToken Address of collateralToken
 * @returns {object} Pool Contract instance
 */
async function setupVesperPool(collateralToken = Address.DAI) {
  const token = await ethers.getContractAt('IERC20Metadata', collateralToken)
  const tokenName = await token.symbol()
  const poolParams = [`v${tokenName} Pool`, `v${tokenName}`, collateralToken]
  const vPool = await deployContract('VPool', poolParams)
  const accountant = await deployContract(PoolAccountant)
  await accountant.init(vPool.address)
  await vPool.initialize(...poolParams, accountant.address)
  return vPool
}

/**
 * Setup Vesper Earn Drip Pool for testing
 *
 * @param {object} obj Test class object
 * @param {object} options optional parameters
 */
async function setupEarnDrip(obj, options) {
  const { AddressZero } = ethers.constants
  for (const strategy of obj.strategies) {
    if (strategy.type.toUpperCase().includes('EARN')) {
      let growPool
      if (strategy.type === 'earnVesperMaker') {
        // For earn Vesper Maker growPool should be same as receiptToken
        growPool = { address: strategy.constructorArgs.receiptToken }
      } else {
        growPool = options.growPool ? options.growPool : { address: AddressZero }
      }
      const rewardTokens = growPool.address === AddressZero ? options.rewardTokens || [] : [growPool.address]
      if (rewardTokens.length > 0) {
        const vesperEarnDrip = await deployContract('VesperEarnDrip', [])
        await vesperEarnDrip.initialize(obj.pool.address, rewardTokens)
        if (growPool.address !== AddressZero) {
          await vesperEarnDrip.updateGrowToken(growPool.address)
        }
        await obj.pool.updatePoolRewards(vesperEarnDrip.address)
        break
      }
    }
  }
}

/**
 * Create and configure Maker strategy. Also update test class object with required data.
 *
 * @param {object} strategy  Strategy config object
 * @param {object} poolAddress Pool address
 * @param {object} options - optional parameters
 * @returns {object} Strategy instance
 */
async function createMakerStrategy(strategy, poolAddress, options) {
  if (!strategy.constructorArgs.cm) {
    const cm = await deployContract(CollateralManager)
    await cm.addGemJoin(gemJoins)
    strategy.constructorArgs.cm = cm
  } else {
    const cm = await ethers.getContractAt('ICollateralManager', strategy.constructorArgs.cm)
    const gemJoin = await cm.mcdGemJoin(strategy.constructorArgs.collateralType)
    if (gemJoin === ethers.constants.AddressZero) {
      const governor = await unlock(await cm.governor())
      await cm.connect(governor).addGemJoin([strategy.setup.maker.gemJoin])
    }
  }
  const strategyInstance = await deployContract(strategy.contract, [
    poolAddress,
    ...Object.values(strategy.constructorArgs),
  ])
  if (!options.skipVault) {
    await strategyInstance.createVault()
  }
  return strategyInstance
}

/**
 * Create and configure a VesperEarn Strategy.
 * Using an up-to-date underlying vPool and VSP rewards enabled
 *
 * @param {object} strategy  Strategy config object
 * @param {object} poolAddress pool address
 * @param {object} options extra params
 * @returns {object} Strategy instance
 */
async function createEarnVesperStrategy(strategy, poolAddress, options) {
  const underlyingVesperPool = await ethers.getContractAt('IVesperPool', strategy.constructorArgs.receiptToken)
  const collateralToken = await underlyingVesperPool.token()

  if (!options.vPool) {
    options.vPool = await setupVesperPool(collateralToken)
    const TOTAL_REWARD = ethers.utils.parseUnits('150000')
    const REWARD_DURATION = 30 * 24 * 60 * 60

    const vPoolRewards = await deployContract('PoolRewards', [])
    const rewardTokens = [Address.Vesper.VSP]
    await vPoolRewards.initialize(poolAddress, rewardTokens)
    await options.vPool.updatePoolRewards(vPoolRewards.address)

    const vsp = await ethers.getContractAt('IVSP', Address.Vesper.VSP)

    await adjustBalance(Address.Vesper.VSP, vPoolRewards.address, TOTAL_REWARD)

    const notifyMultiSignature = 'notifyRewardAmount(address[],uint256[],uint256[])'
    await vPoolRewards[`${notifyMultiSignature}`]([vsp.address], [TOTAL_REWARD], [REWARD_DURATION])
    strategy.constructorArgs.receiptToken = options.vPool.address
  }

  const strategyInstance = await deployContract(strategy.contract, [
    poolAddress,
    ...Object.values(strategy.constructorArgs),
  ])

  return strategyInstance
}

async function createStrategy(strategy, poolAddress, options = {}) {
  const strategyType = strategy.type
  let instance
  if (
    strategyType === StrategyType.EARN_MAKER ||
    strategyType === StrategyType.AAVE_MAKER ||
    strategyType === StrategyType.COMPOUND_MAKER ||
    strategyType === StrategyType.VESPER_MAKER ||
    strategyType === StrategyType.EARN_VESPER_MAKER
  ) {
    instance = await createMakerStrategy(strategy, poolAddress, options)
  } else if (strategyType === StrategyType.EARN_VESPER) {
    instance = await createEarnVesperStrategy(strategy, poolAddress, options)
  } else {
    instance = await deployContract(strategy.contract, [poolAddress, ...Object.values(strategy.constructorArgs)])
  }
  await instance.approveToken(MAX_UINT)
  await instance.updateFeeCollector(strategy.feeCollector)

  // Earn strategies require call to approveGrowToken
  await executeIfExist(instance.approveGrowToken)

  return instance
}
/**
 * Create strategies instances and set it in test class object
 *
 * @param {object} obj Test class object
 * @param {object} options optional parameters
 */
async function createStrategies(obj, options) {
  await setupEarnDrip(obj, options)
  for (const strategy of obj.strategies) {
    strategy.instance = await createStrategy(strategy, obj.pool.address, options)
  }
}

/**
 * Make a new strategy using old strategy for a pool
 *
 * @param {object} oldStrategy - old strategy object to create a new strategy
 * @param {string} poolAddress - pool address
 * @param {object} _options - optional parameters
 * @returns {object} new strategy object
 */
async function makeNewStrategy(oldStrategy, poolAddress, options) {
  const pool = await ethers.getContractAt('IVesperPool', poolAddress)
  const instance = await createStrategy(oldStrategy, pool.address, options)
  // New is copy of old except that it has new instance
  const newStrategy = { ...oldStrategy }
  newStrategy.instance = instance
  return newStrategy
}

/**
 * @typedef {object} PoolData
 * @property {object} poolConfig - Pool config
 * @property {object []} strategies - Array of strategy configuration
 */

/**
 * Setup Vesper pool for testing
 *
 * @param {object} obj Current calling object aka 'this'
 * @param {PoolData} poolData Data for pool setup
 * @param {object} options optional data
 */
async function setupVPool(obj, poolData, options = {}) {
  const { poolConfig, strategies } = poolData
  if (obj.snapshotRestorer) {
    await obj.snapshotRestorer.restore()
  } else {
    const users = await ethers.getSigners()
    const nonce = await ethers.provider.getTransactionCount(users[0].address)
    const newNonce = Math.floor(Math.random() * 10) + nonce
    // update deployer nonce to avoid address collision
    await helpers.setNonce(users[0].address, newNonce)

    obj.strategies = strategies
    obj.pool = await deployContract(poolConfig.contractName, poolConfig.poolParams)
    obj.accountant = await deployContract(PoolAccountant)
    await obj.accountant.init(obj.pool.address)
    await obj.pool.initialize(...poolConfig.poolParams, obj.accountant.address)
    await obj.pool.updateUniversalFee(poolConfig.setup.universalFee)
    await createStrategies(obj, options)
    await addStrategies(obj)
    const collateralTokenAddress = await obj.pool.token()
    await swapHelper.setupRoutings(obj.strategies, collateralTokenAddress)
    await configureOracles(obj.strategies)
    obj.collateralToken = await ethers.getContractAt(TokenLike, collateralTokenAddress)
    // Save snapshot restorer to restore snapshot and take new one
    obj.snapshotRestorer = await helpers.takeSnapshot()
  }
}

/**
 * Get first event for a transaction
 *
 * @param {object} txnObj transaction object
 * @param {object} contractInstance contract instance which generate an event
 * @param {string} eventName event name
 * @returns {object} an event object
 */
async function getEvent(txnObj, contractInstance, eventName) {
  const txnData = await txnObj.wait()
  const events = txnData.events.filter(event => event.address === contractInstance.address)
  // in case more than one events are found.
  const decodedEvents = events.map(function (event) {
    try {
      // Events from same contract with different name will fail
      return contractInstance.interface.decodeEventLog(eventName, event.data)
    } catch (e) {
      // ignore decoding error as it will fail for events with different name than requested
      return undefined
    }
  })
  // Find 1st event
  return decodedEvents.find(event => !!event)
}

async function getStrategyToken(strategy) {
  const address = await strategy.instance.token()

  let token = await ethers.getContractAt(CToken, address)
  try {
    await token.accrueInterest()
  } catch (e) {
    token = ethers.getContractAt('ERC20', address)
  }
  return token
}

module.exports = {
  setupVPool,
  getEvent,
  makeNewStrategy,
  createStrategy,
  getStrategyToken,
}
