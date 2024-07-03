'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vaETH Pool with StargateV2 strategy', function () {
  testRunner('vaETH', ['StargateV2_ETH'], [{ debtRatio: 9000 }])
})
