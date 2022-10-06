'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAETH Pool with Euler Vesper XY Strategy', function () {
  testRunner('VAETH', ['Euler_Vesper_Xy_ETH_USDC'], [{ debtRatio: 9000 }])
})
