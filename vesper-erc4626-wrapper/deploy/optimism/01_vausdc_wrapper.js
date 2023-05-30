/* eslint-disable no-console */
'use strict'

const VPoolWrapper = 'VPoolWrapper'
const PoolRewardsWrapper = 'PoolRewardsWrapper'

const VPoolWrapperUpgrader = 'VPoolWrapperUpgrader'
const PoolRewardsWrapperUpgrader = 'PoolRewardsWrapperUpgrader'

const Address = require('vesper-commons/utils/chains').getChainData().address

const deployFunction = async function (hre) {
  const { getNamedAccounts, deployments, run } = hre

  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const VPoolWrapperProxy = await deploy(VPoolWrapper, {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: VPoolWrapperUpgrader,
      execute: {
        init: {
          methodName: 'initialize',
          args: [Address.Vesper.vaUSDC],
        },
      },
    },
  })

  await deploy(PoolRewardsWrapper, {
    from: deployer,
    log: true,
    // proxy deployment
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: PoolRewardsWrapperUpgrader,
      execute: {
        init: {
          methodName: 'initialize',
          args: [VPoolWrapperProxy.address, [Address.OP]],
        },
      },
    },
  })

  console.log('Verifying source code on etherscan')
  await run('verify', { address: VPoolWrapperProxy.address, noCompile: true })
}

module.exports = deployFunction
module.exports.tags = [VPoolWrapper]
