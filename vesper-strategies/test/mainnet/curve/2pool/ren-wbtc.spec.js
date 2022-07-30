'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Curve_ren_WBTC'], [{ debtRatio: 10000 }])
})
