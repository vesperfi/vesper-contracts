'use strict'

const deployContract = require('../helper')

const contract = 'Keeper'
const alias = 'PoolKeeper'
const nameArg = 'Vesper Pool Keeper'

const deployFunction = async function (hre) {
  await deployContract(hre, { contract, alias, nameArg })
}
module.exports = deployFunction
module.exports.tags = [alias]
