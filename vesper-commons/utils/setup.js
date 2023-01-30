'use strict'

const hre = require('hardhat')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const ethers = hre.ethers
const StrategyType = require('./strategyTypes')
const { adjustBalance } = require('./balance')
const gemJoins = require('./gemJoins')
const { getChain, getChainData } = require('./chains')
const chain = getChain()
const Address = getChainData().address
hre.address = Address

const MAX_UINT = ethers.constants.MaxUint256
// Contract names
const CToken = 'CToken'
const TokenLike = 'TokenLikeTest'
const CollateralManager = 'CollateralManager'
const PoolAccountant = 'PoolAccountant'

async function executeIfExist(fn, param) {
  if (typeof fn === 'function') {
    if (param) {
      await fn(param)
    } else {
      await fn()
    }
  }
}

async function getIfExist(fn, param) {
  if (typeof fn === 'function') {
    if (param) {
      return fn(param)
    }
    return fn()
  }
  return Promise.resolve()
}

/**
 *
 * @param {string} _address - address to be unlocked
 * @returns {object} - Unlocked Signer object
 */
async function unlock(_address) {
  await helpers.impersonateAccount(_address)
  await helpers.setBalance(_address, ethers.utils.parseEther('1'))
  return ethers.getSigner(_address)
}

/**
 * Deploy contract
 *
 * @param {string} name Name of contract
 * @param {any[]} [params] Constructor params
 * @returns {object} Contract instance
 */
async function deployContract(name, params = []) {
  let contractName
  try {
    // Try to read artifact, if success then 'name' is valid input for deploy.
    await hre.artifacts.readArtifact(name)
    contractName = name
  } catch (error) {
    // Error will be thrown if more than 1 artifacts exist with same name.
    // Get all artifact paths. '_getArtifactPathNoError' is custom method
    const artifactPaths = await hre.artifacts._getArtifactPathNoError(name)
    // Get path which has chain and given 'name' in path
    let artifactPath = artifactPaths.filter(path => path.includes(chain))[0]
    // If not such path exist then use the first path from all paths
    if (!artifactPath) {
      artifactPath = artifactPaths[0]
    }
    contractName = artifactPath
  }
  const contractFactory = await ethers.getContractFactory(contractName)
  return contractFactory.deploy(...params)
}

// eslint-disable-next-line complexity
async function setDefaultRouting(swapperAddress, pairs) {
  const abi = [
    'function setDefaultRouting(uint8, address, address, uint8, bytes) external',
    'function governor() external view returns(address)',
    'function addressProvider() external view returns(address)',
    'function defaultRoutings(bytes memory) external view returns(bytes memory)',
  ]
  const swapper = await ethers.getContractAt(abi, swapperAddress)

  let governor
  try {
    governor = await swapper.governor()
  } catch (e) {
    const apABI = ['function governor() external view returns(address)']
    const addressProvider = await ethers.getContractAt(apABI, await swapper.addressProvider())
    governor = await addressProvider.governor()
  }

  const caller = await unlock(governor)
  const ExchangeType = {
    UNISWAP_V2: 0,
    SUSHISWAP: 1,
    TRADERJOE: 2,
    PANGOLIN: 3,
    QUICKSWAP: 4,
    UNISWAP_V3: 5,
    PANCAKE_SWAP: 6,
  }
  let defaultExchange
  switch (chain) {
    case 'avalanche':
      defaultExchange = ExchangeType.TRADERJOE
      break
    case 'bsc':
      defaultExchange = ExchangeType.PANCAKE_SWAP
      break
    default:
      defaultExchange = ExchangeType.UNISWAP_V2
  }

  const swapType = { EXACT_INPUT: 0, EXACT_OUTPUT: 1 }
  for (let pair of pairs) {
    let exchange = defaultExchange
    let tokens = [pair.tokenIn, Address.NATIVE_TOKEN, pair.tokenOut]
    if (pair.tokenIn === Address.NATIVE_TOKEN || pair.tokenOut === Address.NATIVE_TOKEN) {
      tokens = [pair.tokenIn, pair.tokenOut]
    }
    let path = ethers.utils.defaultAbiCoder.encode(['address[]'], [tokens])
    if (chain !== 'bsc') {
      if (chain === 'mainnet' && (pair.tokenIn === Address.Stargate.STG || pair.tokenOut === Address.Stargate.STG)) {
        // uni3 has pair of USDC, WETH in 0.3 fee pool.
        path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 3000, pair.tokenOut])
        exchange = ExchangeType.UNISWAP_V3
        if (pair.tokenOut == Address.DAI || pair.tokenOut == Address.FRAX) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 3000, Address.USDC, 3000, pair.tokenOut],
          )
        }
      } else if (pair.tokenIn === Address.Curve.CRV && pair.tokenOut === Address.USDC) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 10000, Address.NATIVE_TOKEN, 3000, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.Curve.CRV && pair.tokenOut === Address.FEI) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 3000, Address.NATIVE_TOKEN, 3000, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.Curve.CRV && pair.tokenOut === Address.ALUSD) {
        path = ethers.utils.defaultAbiCoder.encode(['address[]'], [[pair.tokenIn, Address.NATIVE_TOKEN, pair.tokenOut]])
        exchange = ExchangeType.SUSHISWAP
      }
    }

    await swapper.connect(caller).setDefaultRouting(swapType.EXACT_INPUT, pair.tokenIn, pair.tokenOut, exchange, path)
    await swapper.connect(caller).setDefaultRouting(swapType.EXACT_OUTPUT, pair.tokenIn, pair.tokenOut, exchange, path)
  }
}

// eslint-disable-next-line complexity
async function configureSwapper(strategies, collateral) {
  const pairs = []
  for (const strategy of strategies) {
    const strategyType = strategy.type.toLowerCase()
    const rewardToken =
      (await getIfExist(strategy.instance.rewardToken)) || (await getIfExist(strategy.instance.rewardTokens, [0]))
    if (rewardToken) {
      pairs.push({ tokenIn: rewardToken, tokenOut: collateral })
    }

    const strategyName = await strategy.instance.NAME()
    if (strategyName.includes('AaveV3')) {
      // get reward token list from AaveIncentivesController
      const aToken = await ethers.getContractAt(
        ['function getIncentivesController() external view returns (address)'],
        await strategy.instance.receiptToken(),
      )
      const incentiveController = await ethers.getContractAt(
        ['function getRewardsList() external view returns (address[] memory)'],
        await aToken.getIncentivesController(),
      )
      const _rewardTokens = await getIfExist(incentiveController.getRewardsList)
      for (let i = 0; i < _rewardTokens.length; i++) {
        pairs.push({ tokenIn: _rewardTokens[i], tokenOut: collateral })
      }
    }
    if (strategyName.includes('Curve')) {
      const rewardTokens = await strategy.instance.getRewardTokens()
      for (let i = 0; i < rewardTokens.length; i++) {
        pairs.push({ tokenIn: rewardTokens[i], tokenOut: collateral })
      }
    }
    if (strategyType.includes('xy')) {
      const token1 = collateral
      const token2 = await strategy.instance.borrowToken()
      pairs.push({ tokenIn: token1, tokenOut: token2 })
      pairs.push({ tokenIn: token2, tokenOut: token1 })
    }

    if (strategyType.includes('vesper') && Address.Vesper.VSP) {
      pairs.push({ tokenIn: Address.Vesper.VSP, tokenOut: collateral })
    }
    if (strategyType.includes('maker')) {
      pairs.push({ tokenIn: Address.DAI, tokenOut: collateral })
      pairs.push({ tokenIn: collateral, tokenOut: Address.DAI })
    }
    if (strategyType.includes('earn')) {
      const dripToken = await strategy.instance.dripToken()
      pairs.push({ tokenIn: collateral, tokenOut: dripToken })
    }
  }

  const swapperAddress = strategies[0].constructorArgs.swapper
  await setDefaultRouting(swapperAddress, pairs)
}

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
    obj.strategies = strategies
    obj.pool = await deployContract(poolConfig.contractName, poolConfig.poolParams)
    obj.accountant = await deployContract(PoolAccountant)
    await obj.accountant.init(obj.pool.address)
    await obj.pool.initialize(...poolConfig.poolParams, obj.accountant.address)
    await obj.pool.updateUniversalFee(poolConfig.setup.universalFee)
    await createStrategies(obj, options)
    await addStrategies(obj)
    const collateralTokenAddress = await obj.pool.token()
    await configureSwapper(obj.strategies, collateralTokenAddress)
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
  deployContract,
  setupVPool,
  getEvent,
  makeNewStrategy,
  createStrategy,
  unlock,
  executeIfExist,
  getIfExist,
  getStrategyToken,
}
