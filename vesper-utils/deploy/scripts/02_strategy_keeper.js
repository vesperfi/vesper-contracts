'use strict'

const deployContract = require('../helper')

const contract = 'Keeper'
const alias = 'StrategyKeeper'
const nameArg = 'Strategy Keeper'

const deployFunction = async function (hre) {
  await deployContract(hre, { contract, alias, nameArg })
}
module.exports = deployFunction
module.exports.tags = [alias]
