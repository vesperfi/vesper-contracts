'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool with StargateV2 strategy', function () {
  testRunner('VAETH', ['StargateV2_ETH'], [{ debtRatio: 9000 }])
})
