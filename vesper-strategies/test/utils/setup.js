'use strict'

const hre = require('hardhat')
const ethers = hre.ethers
const provider = hre.waffle.provider
const { getChain, getChainData } = require('vesper-commons/utils/chains')
const chain = getChain()
const Address = getChainData().address
hre.address = Address

// Contract names
const CToken = 'CToken'

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
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [_address],
  })
  await hre.network.provider.request({
    method: 'hardhat_setBalance',
    params: [_address, ethers.utils.hexStripZeros(ethers.utils.parseEther('1').toHexString())],
  })
  return ethers.getSigner(_address)
}

/**
 * Deploy contract
 *
 * @param {string} name Name of contract
 * @param {any[]} [params] Constructor params
 * @returns {object} Contract instance
 */
async function deployContract(name, params = [], signer = {}) {
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
  const contractFactory = await ethers.getContractFactory(contractName, signer)
  return contractFactory.deploy(...params)
}

// eslint-disable-next-line max-params
async function setDefaultRouting(swapper, caller, tokenIn, tokenOut, swapType = 0) {
  // const SwapType = { EXACT_INPUT: 0, EXACT_OUTPUT: 1 }
  const ExchangeType = { UNISWAP_V2: 0, SUSHISWAP: 1, UNISWAP_V3: 2 }
  const path2 = ethers.utils.defaultAbiCoder.encode(['address[]'], [[tokenIn, tokenOut]])
  await swapper.connect(caller).setDefaultRouting(swapType, tokenIn, tokenOut, ExchangeType.SUSHISWAP, path2)
}

async function configureSwapper(strategy, collateral) {
  const strategyType = strategy.type.toLowerCase()
  const swapperAddress = strategy.constructorArgs.swapper
  const abi = [
    'function setDefaultRouting(uint8, address, address, uint8, bytes) external',
    'function governor() external view returns(address)',
    'function defaultRoutings(bytes memory) external view returns(bytes memory)',
  ]

  const swapper = await ethers.getContractAt(abi, swapperAddress)
  const governor = await unlock(await swapper.governor())

  const rewardToken = await strategy.instance.rewardToken()
  // const path2 = ethers.utils.defaultAbiCoder.encode(['address[]'], [[rewardToken, collateral]])
  // await swapper.connect(governor).setDefaultRouting('0', rewardToken, collateral, '1', path2)
  await setDefaultRouting(swapper, governor, rewardToken, collateral)

  if (strategyType.includes('vesper')) {
    // const path = ethers.utils.defaultAbiCoder.encode(['address[]'], [[VSP, collateral]])
    // await swapper.connect(governor).setDefaultRouting('0', VSP, collateral, '1', path)
    await setDefaultRouting(swapper, governor, Address.Vesper.VSP, collateral)
  }

  if (strategyType.includes('xy')) {
    const LINK = Address.LINK
    // const path3 = ethers.utils.defaultAbiCoder.encode(['address[]'], [[collateral, LINK]])
    // await swapper.connect(governor).setDefaultRouting('1', collateral, LINK, '1', path3)
    await setDefaultRouting(swapper, governor, collateral, LINK, '1') // EXACT_OUTPUT
    // const path4 = ethers.utils.defaultAbiCoder.encode(['address[]'], [[LINK, collateral]])
    // await swapper.connect(governor).setDefaultRouting('0', LINK, collateral, '1', path4)
    await setDefaultRouting(swapper, governor, LINK, collateral)
  }
}

async function removeStrategies(accountant) {
  // const accountant = obj.accountant
  const strategyAbiV3 = ['function keepers() external view returns (address)', 'function rebalance() external']
  const addressListAbi = ['function at(uint) external view returns (address)']
  const strategies = await accountant.getStrategies()
  for (const strategyAddress of strategies) {
    const info = await accountant.strategy(strategyAddress)
    // Check if debtRatio is > 1%
    if (info._debtRatio > 100) {
      // Updated debtRatio to be 1%
      await accountant.updateDebtRatio(strategyAddress, 100)
      let strategyContract = await ethers.getContractAt('IStrategy', strategyAddress)
      const version = await strategyContract.VERSION()
      let keeper
      if (version.startsWith('3')) {
        strategyContract = await ethers.getContractAt(strategyAbiV3, strategyAddress)
        const keeperList = await ethers.getContractAt(addressListAbi, await strategyContract.keepers())
        keeper = await unlock(await keeperList.at(0))
        await strategyContract.connect(keeper).rebalance()
      } else {
        keeper = await unlock((await strategyContract.keepers())[0])
      }
      await strategyContract.connect(keeper).rebalance()
    }
  }
}

/**
 * Add in pool
 *
 * @param {object} accountant PoolAccountant instance
 * @param {object} strategy Strategy instance with config details
 */
async function addStrategy(accountant, strategy) {
  await accountant.addStrategy(strategy.instance.address, ...Object.values(strategy.config))
}

async function createStrategy(strategy, governor) {
  const instance = await deployContract(strategy.contract, Object.values(strategy.constructorArgs), governor)
  await instance.approveToken()
  await instance.updateFeeCollector(strategy.feeCollector)
  // Earn strategies require call to approveGrowToken
  await executeIfExist(instance.approveGrowToken)
  return instance
}

/**
 * Make a new strategy using old strategy for a pool
 *
 * @param {object} oldStrategy - old strategy object to create a new strategy
 * @param {string} poolAddress - pool address
 * @param {object} _options - optional parameters
 * @returns {object} new strategy object
 */
async function makeNewStrategy(oldStrategy, poolAddress, _options) {
  const options = {
    collateralManager: oldStrategy.instance.collateralManager,
    ..._options,
  }
  const instance = await createStrategy(oldStrategy, poolAddress, options)
  // New is copy of old except that it has new instance
  const newStrategy = { ...oldStrategy }
  newStrategy.instance = instance
  return newStrategy
}

/**
 * Setup strategy for testing
 *
 * @param {object} obj Current calling object aka 'this'
 * @param {object} strategy Strategy config data
 * @param {object} options optional data
 */
async function setupStrategy(obj, strategy, options = {}) {
  const isInCache = obj.snapshot === undefined ? false : await provider.send('evm_revert', [obj.snapshot])
  if (isInCache === true) {
    // Rollback manual changes to objects
    delete obj.pool.depositsCount
    // Recreate the snapshot after rollback, reverting deletes the previous snapshot
    obj.snapshot = await provider.send('evm_snapshot')
  } else {
    obj.strategy = strategy

    const pool = await ethers.getContractAt('IVesperPool', strategy.constructorArgs.pool)
    let governor = await pool.governor()
    governor = await unlock(governor)
    const accountant = await ethers.getContractAt('IPoolAccountantTest', await pool.poolAccountant(), governor)
    const collateralToken = await ethers.getContractAt('IERC20Metadata', await pool.token())
    obj.pool = pool
    obj.governor = governor
    obj.accountant = accountant
    obj.collateralToken = collateralToken

    obj.strategy.instance = await createStrategy(strategy, governor, options)
    await removeStrategies(accountant)
    await addStrategy(accountant, obj.strategy)
    await configureSwapper(obj.strategy, collateralToken.address)
    // Save snapshot ID for reuse in consecutive tests
    obj.snapshot = await provider.send('evm_snapshot')
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
  const name = strategy.constructorArgs.strategyName
  const address = await strategy.instance.token()
  // TODO fine tune this
  if (
    name.toLowerCase().includes('compound') ||
    strategy.type.toLowerCase().includes('compound') ||
    strategy.type.includes('traderJoe')
  ) {
    return ethers.getContractAt(CToken, address)
  }
  return ethers.getContractAt('ERC20', address)
}

module.exports = {
  deployContract,
  setupStrategy,
  getEvent,
  makeNewStrategy,
  createStrategy,
  unlock,
  executeIfExist,
  getIfExist,
  getStrategyToken,
}
