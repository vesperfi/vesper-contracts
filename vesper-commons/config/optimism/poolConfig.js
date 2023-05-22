'use strict'

const Address = require('./address')
const setup = { universalFee: 200 }

const rewards = { contract: 'PoolRewards', tokens: [Address.OP] }

const PoolConfig = {
  VAETH: {
    contractName: 'VETH',
    poolParams: ['vaETH Pool', 'vaETH', Address.WETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAUSDC: {
    contractName: 'VPool',
    poolParams: ['vaUSDC Pool', 'vaUSDC', Address.USDC],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAOP: {
    contractName: 'VPool',
    poolParams: ['vaOP Pool', 'vaOP', Address.OP],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  vawstETH: {
    contractName: 'VPool',
    poolParams: ['vawstETH Pool', 'vawstETH', Address.wstETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
}

module.exports = Object.freeze(PoolConfig)
