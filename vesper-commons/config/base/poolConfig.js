'use strict'

const Address = require('./address')

const setup = { universalFee: 200, keeper: Address.Vesper.PoolKeeper, maintainer: Address.Vesper.PoolMaintainer }
const rewards = { contract: 'PoolRewards', tokens: [] }

const PoolConfig = {
  vaETH: {
    contractName: 'VETH',
    poolParams: ['vaETH Pool', 'vaETH', Address.WETH],
    setup,
    rewards,
  },

  vaUSDC: {
    contractName: 'VPool',
    poolParams: ['vaUSDC Pool', 'vaUSDC', Address.USDC],
    setup,
    rewards,
  },
}

module.exports = Object.freeze(PoolConfig)
