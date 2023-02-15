'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Compound_Vesper_Xy_WBTC_DAI'], [{ debtRatio: 9000 }])
  testRunner('VAWBTC', ['Compound_Vesper_Xy_WBTC_USDC'], [{ debtRatio: 9000 }])
})
