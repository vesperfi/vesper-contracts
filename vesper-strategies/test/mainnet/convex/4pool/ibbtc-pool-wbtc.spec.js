'use strict'

const testRunner = require('../../../utils/testRunner')

describe('ibbtc VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Convex_ibBTC_WBTC'], [{ debtRatio: 10000 }])
})
