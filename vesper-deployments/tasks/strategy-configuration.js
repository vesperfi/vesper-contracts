'use strict'
const fs = require('fs')
const copy = require('recursive-copy')

// Validate each key has a value
function validateObject(object) {
  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Object) {
      // recursive call
      validateObject(value)
    } else if (value === undefined || value === '') {
      throw new Error(`Value is missing for key ${key} in strategy config`)
    }
  }
}

/* eslint-disable complexity */
task('strategy-configuration', 'Prepare strategy configuration for deployment')
  .addOptionalParam('strategyName', 'Name of strategy to deploy')
  .addOptionalParam('targetChain', 'Target chain where contracts will be deployed')
  .addOptionalParam('strategyConfig', 'strategy config object')
  .addOptionalParam('multisigNonce', 'Starting nonce number to propose Gnosis safe multisig transaction')
  .addOptionalParam('oldStrategyName', 'Old Strategy name (needed in case contract name is changed during migration)')
  .setAction(async function ({
    strategyName,
    targetChain = hre.targetChain,
    strategyConfig,
    multisigNonce,
    oldStrategyName,
  }) {
    if (!strategyName) {
      // not deploying strategy
      return
    }
    let additionalConfig
    if (typeof strategyConfig === 'string') {
      additionalConfig = JSON.parse(strategyConfig)
    }
    const fileName = `vesper-commons/config/${targetChain}/strategyConfig`
    let config = { ...require(fileName)[strategyName] }
    additionalConfig = { ...config.config, ...additionalConfig }
    config = { ...config, config: additionalConfig }
    if (!config) {
      throw new Error(`Missing strategy configuration in ${fileName}.js`)
    }

    validateObject(config)

    config.alias = strategyName
    console.log(
      `Deploying ${strategyName} on ${hre.network.name} for ${hre.targetChain} with following configuration: `,
      config,
    )

    // Set configuration in hre
    hre.strategyConfig = config
    hre.multisigNonce = multisigNonce
    hre.oldStrategyName = oldStrategyName

    // For localhost strategy deployment, if pool dir do not exits, then copy from targetChain.
    const networkDir = './deployments/localhost'
    const poolDir = `${networkDir}/${hre.poolName}`
    const targetChainNetworkDir = `./deployments/${targetChain}`
    if (hre.network.name === 'localhost' && !fs.existsSync(poolDir)) {
      const targetChainPoolDir = `${targetChainNetworkDir}/${hre.poolName}`
      if (fs.existsSync(targetChainPoolDir)) {
        await copy(targetChainPoolDir, poolDir, { overwrite: true })
      }
      // If not .chainId in localhost network directory then copy from targetChain network directory
      if (!fs.existsSync(`${networkDir}/.chainId`)) {
        await copy(`./deployments/${targetChain}`, networkDir, { dot: true, filter: '.chainId' })
      }
    }

    // CollateralManger.json is required for localhost Maker strategy deployment.
    if (hre.network.name === 'localhost' && strategyName.includes('Maker')) {
      const targetChainGlobalDir = `${targetChainNetworkDir}/global`
      if (fs.existsSync(targetChainGlobalDir)) {
        await copy(targetChainGlobalDir, `${networkDir}/global`, { overwrite: true, filter: 'CollateralManager.json' })
      }
    }
  })

module.exports = {}
