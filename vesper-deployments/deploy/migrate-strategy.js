/* eslint-disable complexity */
'use strict'
const { isDelegateOrOwner, proposeMultiTxn, prepareTxn } = require('./gnosis-txn')
const { ethers } = require('hardhat')

function sleep(ms) {
  console.log(`waiting for ${ms} ms`)
  // eslint-disable-next-line no-undef
  return new Promise(resolve => setTimeout(resolve, ms))
}

const deployFunction = async function ({
  getNamedAccounts,
  deployments,
  poolConfig,
  strategyConfig,
  targetChain,
  multisigNonce = 0,
  oldStrategyName,
}) {
  if (!strategyConfig) {
    throw new Error('Strategy configuration object is not created.')
  }
  const address = require(`vesper-commons/config/${targetChain}/address`)

  const { deploy, execute, read } = deployments
  const { deployer } = await getNamedAccounts()

  const poolProxy = await deployments.get(poolConfig.contractName)

  let strategyAlias = oldStrategyName || strategyConfig.alias

  const constructorArgs = [poolProxy.address, ...Object.values(strategyConfig.constructorArgs)]

  if (strategyAlias.includes('Maker')) {
    // Maker strategy of any type, EarnXXXMaker, XXXMaker
    const cm = address.Vesper.COLLATERAL_MANAGER
    if (!cm) {
      // For migrate we expect Collateral Manager to be deployed
      throw new Error('Collateral Manager address is missing in address.json')
    }
    // Fail fast: By reading any property we make sure deployment object exist for CollateralManager
    try {
      await read('CollateralManager', {}, 'treasury')
    } catch (e) {
      throw new Error(`Missing Collateral Manager deployment object. 
          If you are deploying in localhost, please copy CollateralManager.json 
          from /deployments/${targetChain}/global to /deployments/localhost/global`)
    }
  }

  // Get old strategy. It is very important to get it first as new deploy will overwrite it
  const oldStrategy = await deployments.get(strategyAlias)

  strategyAlias = strategyConfig.alias
  // Deploy new version strategy
  const newStrategy = await deploy(strategyAlias, {
    contract: strategyConfig.contract,
    from: deployer,
    log: true,
    args: constructorArgs,
  })

  // Execute configuration transactions
  await execute(strategyAlias, { from: deployer, log: true }, 'approveToken', ethers.constants.MaxUint256)

  // For earn strategies approve grow token
  if (strategyAlias.includes('Earn')) {
    await execute(strategyAlias, { from: deployer, log: true }, 'approveGrowToken')
  }

  const setup = strategyConfig.setup

  const governor = await read(poolConfig.contractName, {}, 'governor')
  const shouldProposeTx =
    address.MultiSig.safe === governor && (await isDelegateOrOwner(address.MultiSig.safe, deployer, targetChain))
  if (deployer !== governor && !shouldProposeTx) {
    console.log('Deployer is not governor and delegate of governor. Rest of configuration must be handled manually')
    return
  }
  const strategyOps = {
    alias: strategyAlias,
    contractName: strategyConfig.contract,
    contractAddress: newStrategy.address,
  }
  const operations = [
    {
      ...strategyOps,
      params: ['updateFeeCollector', [setup.feeCollector]],
    },
  ]

  for (const keeper of setup.keepers) {
    const _keepers = await read(strategyAlias, {}, 'keepers')
    if (!_keepers.includes(ethers.utils.getAddress(keeper))) {
      const params = ['addKeeper', [keeper]]
      operations.push({ ...strategyOps, params })
    }
  }

  console.log(`Migrating ${strategyAlias} from ${oldStrategy.address} to ${newStrategy.address}`)

  // Migrate strategy
  operations.push({
    alias: poolConfig.contractName,
    contractName: poolConfig.contractName,
    contractAddress: poolProxy.address,
    params: ['migrateStrategy', [oldStrategy.address, newStrategy.address]],
  })

  const bundleTxs = []
  for (const operation of operations) {
    if (shouldProposeTx) {
      console.log(`preparing multisig tx for ${operation.params[0]}`)
      bundleTxs.push(await prepareTxn(operation.contractName, operation.contractAddress, ...operation.params))
    } else {
      await sleep(5000)
      await execute(operation.alias, { from: deployer, log: true }, operation.params[0], ...operation.params[1])
    }
  }
  if (bundleTxs.length > 0) {
    console.log('Sending multisig tx')
    await proposeMultiTxn(address.MultiSig.safe, targetChain, deployer, multisigNonce, bundleTxs, address.MultiSend)
  }

  const strategyVersion = await read(strategyAlias, {}, 'VERSION')
  deployFunction.id = `${strategyAlias}-v${strategyVersion}`
  return true
}
module.exports = deployFunction
module.exports.tags = ['migrate-strategy']
