'use strict'

const Address = require('./address')

const setup = { universalFee: 200 }
const rewards = { contract: 'PoolRewards', tokens: [] }

const PoolConfig = {
  VABUSD: {
    contractName: 'VPool',
    poolParams: ['vaBUSD Pool', 'vaBUSD', Address.BUSD],
    setup: { ...setup }, // Shallow copy
    rewards: { ...rewards },
  },
  VABNB: {
    contractName: 'VETH',
    poolParams: ['vaBNB Pool', 'vaBNB', Address.WBNB],
    setup: { ...setup }, // Shallow copy
    rewards: { ...rewards },
  },
}

module.exports = Object.freeze(PoolConfig)
