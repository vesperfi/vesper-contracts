'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vaUSDC Pool with StargateV2 strategy', function () {
  testRunner('vaUSDC', ['StargateV2_USDC'], [{ debtRatio: 9000 }])
})
