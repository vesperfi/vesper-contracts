/* eslint-disable no-console */
'use strict'

const Operator = 'Operator'
const Maintainer = 'Maintainer'

const deployFunction = async function (hre) {
  const { getNamedAccounts, deployments, run } = hre

  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const deployed = await deploy(Maintainer, {
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      implementationName: Operator,
      execute: {
        init: {
          methodName: 'initialize',
          args: [Maintainer],
        },
      },
    },
  })

  console.log('Verifying source code on etherscan')
  await run('verify', { address: deployed.address, noCompile: true })
}
module.exports = deployFunction
module.exports.tags = [Maintainer]
