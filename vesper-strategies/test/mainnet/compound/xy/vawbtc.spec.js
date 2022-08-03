'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Compound_Xy_WBTC_DAI'], [{ debtRatio: 9000 }])
})
