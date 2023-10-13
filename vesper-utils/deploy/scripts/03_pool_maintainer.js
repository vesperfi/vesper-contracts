'use strict'

const deployContract = require('../helper')

const contract = 'Maintainer'
const alias = 'PoolMaintainer'
const nameArg = 'Vesper Pool Maintainer'

const deployFunction = async function (hre) {
  await deployContract(hre, { contract, alias, nameArg })
}
module.exports = deployFunction
module.exports.tags = [alias]
