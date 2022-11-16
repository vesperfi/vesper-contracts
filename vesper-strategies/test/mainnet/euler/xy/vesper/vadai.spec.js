'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VADAI Pool with Euler Vesper XY Strategy', function () {
  testRunner('VADAI', ['Euler_Vesper_Xy_DAI_USDC'], [{ debtRatio: 9000 }])
})
