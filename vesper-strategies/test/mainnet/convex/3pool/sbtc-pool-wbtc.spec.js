'use strict'

const testRunner = require('../../../utils/testRunner')

describe('sbtc VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Convex_sbtc_WBTC'], [{ debtRatio: 10000 }])
})
