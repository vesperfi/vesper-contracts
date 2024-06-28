'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with StargateV2 strategy', function () {
  testRunner('VAUSDC', ['StargateV2_USDC'], [{ debtRatio: 9000 }])
})
