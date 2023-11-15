/* eslint-disable no-console */
'use strict'

const RevenueSplitter = 'RevenueSplitter'

// Payees = [Vesper Gnosis safe(DAO), VBC(VSP.eth)]
const payees = ['0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A', '0xf4087b7AB24Bde9c445ddD0bc4DF257F81277214']
const shares = ['9500', '500']

const deployFunction = async function (hre) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  await deploy(RevenueSplitter, {
    from: deployer,
    log: true,
    args: [payees, shares],
  })
}

module.exports = deployFunction
module.exports.tags = [RevenueSplitter]
