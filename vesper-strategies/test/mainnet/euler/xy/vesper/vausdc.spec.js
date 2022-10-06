'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAUSDC Pool with Euler Vesper XY Strategy', function () {
  testRunner('VAUSDC', ['Euler_Vesper_Xy_USDC_WBTC'], [{ debtRatio: 9000 }])
})
