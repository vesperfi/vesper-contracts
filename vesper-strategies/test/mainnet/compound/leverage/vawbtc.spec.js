'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Compound_Leverage_WBTC'], [{ debtRatio: 9000 }])
})
