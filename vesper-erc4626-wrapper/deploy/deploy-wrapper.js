/* eslint-disable no-console */
'use strict'

const VPoolWrapper = 'VPoolWrapper'
const PoolRewardsWrapper = 'PoolRewardsWrapper'

const VPoolWrapperUpgrader = 'VPoolWrapperUpgrader'
const PoolRewardsWrapperUpgrader = 'PoolRewardsWrapperUpgrader'

const deployWrapper = async function (
  hre,
  { collateralToken, rewardsToken, vPoolWrapperAlias, poolRewardsWrapperAlias },
) {
  const { getNamedAccounts, deployments, run } = hre

  const { deploy, execute, get, read } = deployments
  const { deployer } = await getNamedAccounts()

  const VPoolWrapperProxy = await deploy(vPoolWrapperAlias, {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: VPoolWrapperUpgrader,
      implementationName: VPoolWrapper,
      execute: {
        init: {
          methodName: 'initialize',
          args: [collateralToken],
        },
      },
    },
  })

  const RewardsWrapperProxy = await deploy(poolRewardsWrapperAlias, {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      viaAdminContract: PoolRewardsWrapperUpgrader,
      implementationName: PoolRewardsWrapper,
      execute: {
        init: {
          methodName: 'initialize',
          args: [VPoolWrapperProxy.address, [rewardsToken]],
        },
      },
    },
  })

  const currentRewards = await read(vPoolWrapperAlias, 'wrapperRewards')
  if (currentRewards !== RewardsWrapperProxy.address) {
    await execute(vPoolWrapperAlias, { from: deployer, log: true }, 'updateWrapperRewards', RewardsWrapperProxy.address)
  }

  console.log('Verifying source code on etherscan')
  await run('verify', { address: VPoolWrapperProxy.address, noCompile: true })
  await run('verify', { address: RewardsWrapperProxy.address, noCompile: true })

  const PoolUpgrader = await get(VPoolWrapperUpgrader)
  await run('verify', { address: PoolUpgrader.address, noCompile: true, constructorArgsParams: [deployer] })

  const PoolRewardsUpgrader = await get(PoolRewardsWrapperUpgrader)
  await run('verify', { address: PoolRewardsUpgrader.address, noCompile: true, constructorArgsParams: [deployer] })
}

module.exports = deployWrapper
