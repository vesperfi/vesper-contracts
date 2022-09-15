'use strict'

const testRunner = require('../../../utils/testRunner')

describe('aave VAUSDCe Pool', function () {
  testRunner('VAUSDCe', ['Curve_aave_USDCe'], [{ debtRatio: 10000 }])
})
