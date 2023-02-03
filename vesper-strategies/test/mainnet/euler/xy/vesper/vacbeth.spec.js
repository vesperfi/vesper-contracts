'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VACBETH Pool with Euler Vesper XY Strategy', function () {
  testRunner('VACBETH', ['Euler_Vesper_Xy_CBETH_USDC'], [{ debtRatio: 9000 }])
})
