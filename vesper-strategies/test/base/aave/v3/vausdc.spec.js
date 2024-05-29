'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vaUSDC Pool with Aave V3 strategy', function () {
  testRunner('vaUSDC', ['AaveV3_USDC'], [{ debtRatio: 9000 }])
})
