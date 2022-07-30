'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Convex_ren_WBTC'], [{ debtRatio: 10000 }])
})
