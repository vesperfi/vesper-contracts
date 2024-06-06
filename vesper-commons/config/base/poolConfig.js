'use strict'

const Address = require('./address')

const setup = { universalFee: 200, keeper: Address.Vesper.PoolKeeper, maintainer: Address.Vesper.PoolMaintainer }
const rewards = { contract: 'PoolRewards', tokens: [] }

const PoolConfig = {
  vacbETH: {
    contractName: 'VPool',
    poolParams: ['vacbETH Pool', 'vacbETH', Address.cbETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },

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
