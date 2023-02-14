'use strict'

const { getChainData } = require('vesper-commons/utils/chains')
const { shouldBehaveLikePool } = require('./vesper-pool-behavior')
const { poolConfig } = getChainData()

describe('vaUSDC pool basic tests', function () {
  shouldBehaveLikePool(poolConfig.VAUSDC)
})
