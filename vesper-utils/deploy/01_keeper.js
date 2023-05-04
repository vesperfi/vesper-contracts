/* eslint-disable no-console */
'use strict'

const Operator = 'Operator'
const Keeper = 'Keeper'

const deployFunction = async function (hre) {
  const { getNamedAccounts, deployments, run } = hre

  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const deployed = await deploy(Keeper, {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      implementationName: Operator,
      execute: {
        init: {
          methodName: 'initialize',
          args: [Keeper],
        },
      },
    },
  })

  console.log('Verifying source code on etherscan')
  await run('verify', { address: deployed.address, noCompile: true })
}
module.exports = deployFunction
module.exports.tags = [Keeper]
