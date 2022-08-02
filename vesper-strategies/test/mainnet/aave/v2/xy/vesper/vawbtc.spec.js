'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['AaveV2_Vesper_Xy_WBTC_FEI'], [{ debtRatio: 9000 }])
  testRunner('VAWBTC', ['AaveV2_Vesper_Xy_WBTC_FRAX'], [{ debtRatio: 9000 }])
})
