/* eslint-disable no-console */
'use strict'

const deployContract = async function (hre, contractConfig) {
  const { getNamedAccounts, deployments, run } = hre
  const { contract, alias, nameArg } = contractConfig
  const implementationName = `${contract}_Implementation`

  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const deployed = await deploy(alias, {
    contract,
    from: deployer,
    log: true,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      implementationName,
      execute: {
        init: {
          methodName: 'initialize',
          args: [nameArg],
        },
      },
    },
  })

  console.log('Verifying source code on etherscan')
  await run('verify', { address: deployed.implementation, noCompile: true })
}
module.exports = deployContract
