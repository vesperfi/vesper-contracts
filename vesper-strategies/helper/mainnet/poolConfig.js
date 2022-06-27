'use strict'

const Address = require('./address')
const setup = { universalFee: 200 }

const rewards = { contract: 'PoolRewards', tokens: [Address.Vesper.VSP] }
// Earn pool will have extra data in 'rewards' object. Below is default value for 'rewards' object for Earn pools
const earnRewards = {
  contract: 'VesperEarnDrip',
  tokens: [Address.Vesper.vaDAI, Address.Vesper.VSP],
  growToken: Address.Vesper.vaDAI,
}

const PoolConfig = {
  VAETH: {
    contractName: 'VETH',
    poolParams: ['vaETH Pool', 'vaETH', Address.WETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VEETH_DAI: {
    contractName: 'VETH',
    poolParams: ['veETH-DAI Earn Pool', 'veETH-DAI', Address.WETH],
    setup: { ...setup },
    rewards: { ...earnRewards },
  },
}

module.exports = Object.freeze(PoolConfig)
