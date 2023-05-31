'use strict'

const deployWrapper = require('../deploy-wrapper')
const Address = require('vesper-commons/utils/chains').getChainData().address

const deployFunction = async function (hre) {
  const wrapperConfig = {
    collateralToken: Address.Vesper.vaUSDC,
    rewardsToken: Address.OP,
    vPoolWrapperAlias: 'vaUSDCWrapper',
    poolRewardsWrapperAlias: 'vaUSDCRewardsWrapper',
  }
  await deployWrapper(hre, wrapperConfig)
}

module.exports = deployFunction
module.exports.tags = ['vaUSDCWrapper']
