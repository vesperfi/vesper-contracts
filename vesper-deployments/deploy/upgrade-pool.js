'use strict'

const { OperationType } = require('ethers-multisend')
const { ethers } = require('hardhat')
const { isDelegateOrOwner, proposeMultiTxn } = require('./gnosis-txn')

const PoolAccountant = 'PoolAccountant'
const VPoolUpgrader = 'VPoolUpgrader'
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
const newKeepers = ['0x1cbfae0367a9b1e4ac2c158e57b5f00ccb337271', '0xdf826ff6518e609e4cee86299d40611c148099d5']
const newMaintainers = [
  '0x1cbfae0367a9b1e4ac2c158e57b5f00ccb337271',
  '0xdf826ff6518e609e4cee86299d40611c148099d5',
  '0x76d266dfd3754f090488ae12f6bd115cd7e77ebd',
]

// eslint-disable-next-line consistent-return
function sleep(network, ms) {
  if (network !== 'localhost') {
    console.log(`waiting for ${ms} ms`)
    // eslint-disable-next-line no-undef
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

async function prepareTxn(contractName, address, method, methodArgs) {
  const contract = await ethers.getContractAt(contractName, address)
  const encodedTxn = await contract.populateTransaction[method](...methodArgs)
  return {
    operation: OperationType.Call,
    to: address,
    value: 0,
    data: encodedTxn.data,
  }
}

// eslint-disable-next-line max-params
async function addKeeperOrMaintainer(vPool, deployer, address, safe, canPropose, txnsToPropose, proxy, methodName) {
  const governor = await vPool.governor()
  if (governor === deployer) {
    await vPool[methodName](address)
  } else if (governor === safe && canPropose) {
    const tx = await prepareTxn('VPool', proxy.address, methodName, [address])
    txnsToPropose.push(tx)
  } else {
    console.log(`'\nSafe is not governor of pool, ${methodName} to be call manually\n'`)
  }
}

async function getProxyAdminAddress(proxyAddress) {
  const proxyAdminStorage = (await ethers.provider.getStorageAt(proxyAddress, ADMIN_SLOT)).toString()
  if (proxyAdminStorage.length === 42) {
    return ethers.utils.getAddress(proxyAdminStorage)
  }
  return `0x${proxyAdminStorage.slice(26)}`
}

// eslint-disable-next-line max-params
async function deployUpgraderIfNeeded(hre, upgraderName, existingUpgraderAddress, deployer, proxy) {
  const { deployments, targetChain } = hre
  const { deploy, read } = deployments
  const address = require(`vesper-commons/config/${targetChain}/address`)

  // Deploy upgrader. Hardhat-deploy will reuse contract if already exist
  const multiCall = address.MultiCall
  const upgrader = await deploy(upgraderName, {
    from: deployer,
    log: true,
    args: [multiCall],
  })
  const proxyAdmin = await read(upgraderName, 'getProxyAdmin', proxy.address).catch(() => null)
  if (!proxyAdmin) {
    const existingUpgrader = await ethers.getContractAt(upgraderName, existingUpgraderAddress)
    await existingUpgrader.getProxyAdmin(proxy.address).catch(function (error) {
      throw new Error(`Either no artifact found or not the proxyAdmin, ${error}`)
    })
    if ((await existingUpgrader.owner()) !== deployer) {
      throw new Error('Deployer is not owner of DefaultProxyAdmin. Cant upgrade pool')
    }

    console.log('Changing proxy admin to new proxy admin.', upgrader.address)
    await existingUpgrader.changeProxyAdmin(proxy.address, upgrader.address)
  }
}

/* eslint-disable complexity */
async function safeUpgrade(hre, deployer, contract, params = []) {
  const { deployments, targetChain } = hre
  const { deploy, execute } = deployments
  let upgraderName = `${contract}Upgrader`
  if (contract === 'VETH') {
    upgraderName = VPoolUpgrader
  }
  const address = require(`vesper-commons/config/${targetChain}/address`)
  const safe = address.MultiSig.safe
  const proxy = await deployments.get(contract)

  // Deployment may not exist so keep using ethers.getContractAt. DO NOT use read()
  const upgrader = await ethers.getContractAt(upgraderName, await getProxyAdminAddress(proxy.address))
  const upgraderOwner = await upgrader.owner()
  const canPropose = isDelegateOrOwner(safe, deployer, targetChain)
  // Safe is owner of upgrader but deployer is neither owner nor delegate. Fail fast
  if (safe === upgraderOwner && !canPropose) {
    throw new Error('Deployer is neither owner nor delegate of Gnosis safe', safe)
  }

  // This is temporary process until we use upgrader everywhere
  if (deployer === upgraderOwner) {
    await deployUpgraderIfNeeded(hre, upgraderName, upgrader.address, deployer, proxy)
  }

  console.log(`\nInitiating safeUpgrade of ${contract}`)
  await sleep(hre.network.name, 5000)
  let deployedImpl
  if (Object.keys(hre.contractsToReuse).includes(contract)) {
    deployedImpl = hre.contractsToReuse[contract]
    console.log(`reusing "${contract}" at ${deployedImpl.address}`)
  } else {
    deployedImpl = await deploy(`${contract}_Implementation`, {
      contract,
      from: deployer,
      log: true,
      args: params,
    })
    // Add implementation address in hre
    hre.implementations[contract] = deployedImpl.address
  }
  await sleep(hre.network.name, 5000)
  const txnsToPropose = []
  if (deployer === upgraderOwner) {
    console.log(`Deployer is owner of upgrader. Safe upgrading ${contract} via ${upgraderName}`)
    await execute(upgraderName, { from: deployer, log: true }, 'safeUpgrade', proxy.address, deployedImpl.address)
  } else if (safe === upgraderOwner) {
    console.log(`MultiSig is owner of upgrader. Preparing safeUpgrade of ${contract} via ${upgraderName}`)
    const txn = await prepareTxn(upgraderName, upgrader.address, 'safeUpgrade', [proxy.address, deployedImpl.address])
    txnsToPropose.push(txn)
  } else {
    throw new Error('Deployer is neither owner nor a delegate')
  }

  // This is temporary and for V5 upgrade only
  await sleep(hre.network.name, 5000)
  if (upgraderName === VPoolUpgrader) {
    // If universal fee is zero then call setup
    const vPool = await ethers.getContractAt(contract, proxy.address)
    const universalFee = await vPool.universalFee().catch(() => 0)
    if (universalFee.toString() === '0') {
      const governor = await vPool.governor()
      if (governor === deployer) {
        await vPool.setup()
      } else if (governor === safe && canPropose) {
        txnsToPropose.push(await prepareTxn(contract, proxy.address, 'setup', []))
      } else {
        console.log('\nSafe is not governor of pool, setup needs to be call manually\n')
      }
    }

    let keepers, maintainers
    // Handle Keeper and maintainer
    const version = await vPool.VERSION()
    if (version.startsWith('4.0') || version.startsWith('5.0')) {
      // Add maintainer, keeper which does not exists from new list for 4.0 and 5.0.
      // Maintainer/keeper is not lost when upgraded from 4.x to 5.x but
      // it's good to have new keepers/maintainer if not already exists.
      keepers = await vPool.keepers()
      maintainers = await vPool.maintainers()
    }
    for (let keeper of newKeepers) {
      keeper = ethers.utils.getAddress(keeper)
      if (version.startsWith('3.0') || !keepers.includes(keeper)) {
        await addKeeperOrMaintainer(vPool, deployer, keeper, safe, canPropose, txnsToPropose, proxy, 'addKeeper')
      }
    }
    // maintainer

    for (let maintainer of newMaintainers) {
      maintainer = ethers.utils.getAddress(maintainer)
      if (version.startsWith('3.0') || !maintainers.includes(maintainer)) {
        await addKeeperOrMaintainer(
          vPool,
          deployer,
          maintainer,
          safe,
          canPropose,
          txnsToPropose,
          proxy,
          'addMaintainer',
        )
      }
    }
  }
  return txnsToPropose
}

const deployFunction = async function (hre) {
  const { getNamedAccounts, poolConfig, targetChain, multisigNonce } = hre
  const { deployer } = await getNamedAccounts()
  const address = require(`vesper-commons/config/${targetChain}/address`)
  // This info will be used later in deploy-core-contracts task
  hre.implementations = {}

  const txnsToPropose = []
  let txs = await safeUpgrade(hre, deployer, PoolAccountant)
  txnsToPropose.push(...txs)
  await sleep(hre.network.name, 5000)
  txs = await safeUpgrade(hre, deployer, poolConfig.contractName, ['Vesper Pool', 'vPool', address.ZERO])
  txnsToPropose.push(...txs)
  if (txnsToPropose.length > 0) {
    await proposeMultiTxn(address.MultiSig.safe, targetChain, deployer, multisigNonce, txnsToPropose)
  }
  deployFunction.id = 'upgrade-pool'
  return true
}
module.exports = deployFunction
module.exports.tags = ['upgrade-pool']
