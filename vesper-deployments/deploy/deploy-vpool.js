/* eslint-disable no-console */
'use strict'

const { ethers } = require('hardhat')
const PoolAccountant = 'PoolAccountant'
const PoolAccountantUpgrader = 'PoolAccountantUpgrader'
const VPoolUpgrader = 'VPoolUpgrader'
const PoolRewardsUpgrader = 'PoolRewardsUpgrader'

async function verify(hre, address, constructorArgs = []) {
  console.log('Verifying source code on blockchain explorer')
  await hre.run('verify', {
    address,
    constructorArgsParams: constructorArgs.map(val => val.toString()),
    noCompile: true,
  })
}

const deployFunction = async function (hre) {
  const { getNamedAccounts, deployments, poolConfig, targetChain } = hre
  const { deploy, execute, read, get } = deployments
  const { deployer } = await getNamedAccounts()
  const networkName = hre.network.name
  const Address = require(`vesper-commons/config/${targetChain}/address`)
  // Wait for 2 blocks in network is not localhost
  const waitConfirmations = networkName === 'localhost' ? 0 : 2
  // This info will be used later in deploy-core-contracts task
  hre.implementations = {}

  // Deploy upgrader
  await deploy(PoolAccountantUpgrader, { from: deployer, log: true, args: [Address.MultiCall], waitConfirmations })

  // Deploy PoolAccountant. This call will deploy ProxyAdmin, proxy and PoolAccountant
  const accountantProxy = await deploy(PoolAccountant, {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: PoolAccountantUpgrader,
    },
    waitConfirmations,
  })

  // Add implementation address in hre
  hre.implementations[PoolAccountant] = accountantProxy.implementation

  // Deploy upgrader
  await deploy(VPoolUpgrader, { from: deployer, log: true, args: [Address.MultiCall], waitConfirmations })

  // Deploy Pool. This call will use ProxyAdmin. It will deploy proxy and Pool and also initialize pool
  const poolProxy = await deploy(poolConfig.contractName, {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    args: ['Vesper pool', 'vPool', ethers.constants.AddressZero], // hardcoded impl constructor argument
    // proxy deployment
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: VPoolUpgrader,
      execute: {
        init: {
          methodName: 'initialize',
          args: [...poolConfig.poolParams, accountantProxy.address],
        },
      },
    },
    waitConfirmations,
  })

  // Add implementation address in hre
  hre.implementations[poolConfig.contractName] = poolProxy.implementation

  // Initialize PoolAccountant with pool proxy address
  if ((await read(PoolAccountant, {}, 'pool')) === ethers.constants.AddressZero) {
    await execute(PoolAccountant, { from: deployer, log: true }, 'init', poolProxy.address)
  }

  // Add
  const keeper = poolConfig.setup.keeper
  if (!(await read(poolConfig.contractName, {}, 'isKeeper', keeper))) {
    await execute(poolConfig.contractName, { from: deployer, log: true }, 'addKeeper', keeper)
  }

  // Add maintainer
  const maintainer = poolConfig.setup.maintainer
  if (!(await read(poolConfig.contractName, {}, 'isMaintainer', maintainer))) {
    await execute(poolConfig.contractName, { from: deployer, log: true }, 'addMaintainer', maintainer)
  }

  // verify pool accountant upgrader
  await verify(hre, (await get(PoolAccountantUpgrader)).address, [Address.MultiCall])
  // verify pool accountant implementation
  await verify(hre, accountantProxy.implementation)
  // verify pool upgrader
  await verify(hre, (await get(VPoolUpgrader)).address, [Address.MultiCall])
  // verify pool implementation
  await verify(hre, poolProxy.implementation, ['Vesper pool', 'vPool', ethers.constants.AddressZero])

  // Prepare id of deployment, next deployment will be triggered if id is changed
  const poolVersion = await read(poolConfig.contractName, {}, 'VERSION')
  const poolAccountantVersion = await read(PoolAccountant, {}, 'VERSION')
  deployFunction.id = `${poolConfig.poolParams[1]}-v${poolVersion}_${poolAccountantVersion}`

  if (poolConfig.rewards.tokens.length === 0) {
    return true
  }
  const rewards = poolConfig.rewards
  // Deploy pool rewards
  // Deploy upgrader
  const rewardsUpgrader = await deploy(PoolRewardsUpgrader, {
    from: deployer,
    log: true,
    args: [Address.MultiCall],
    waitConfirmations,
  })

  const rewardsProxy = await deploy(rewards.contract, {
    from: deployer,
    log: true,
    // proxy deployment
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: PoolRewardsUpgrader,
      execute: {
        init: {
          methodName: 'initialize',
          args: [poolProxy.address, rewards.tokens],
        },
      },
    },
    waitConfirmations,
  })

  // Add implementation address in hre
  hre.implementations[rewards.contract] = rewardsProxy.implementation

  // Update pool rewards in pool
  if ((await read(poolConfig.contractName, {}, 'poolRewards')) === ethers.constants.AddressZero) {
    await execute(poolConfig.contractName, { from: deployer, log: true }, 'updatePoolRewards', rewardsProxy.address)
  }

  // verify pool rewards upgrader
  await verify(hre, rewardsUpgrader.address, [Address.MultiCall])
  // verify pool rewards implementation
  await verify(hre, rewardsProxy.implementation)

  return true
}
module.exports = deployFunction
module.exports.tags = ['deploy-vPool']
