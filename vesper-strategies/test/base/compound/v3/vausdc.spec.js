'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vaUSDC Pool with Compound V3 strategy', function () {
  testRunner('vaUSDC', ['CompoundV3_USDC'], [{ debtRatio: 9000 }])
})
