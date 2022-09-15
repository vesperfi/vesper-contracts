'use strict'

const testRunner = require('../../../utils/testRunner')

describe('ren-wbtc VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Curve_ren_WBTC'], [{ debtRatio: 10000 }])
})
