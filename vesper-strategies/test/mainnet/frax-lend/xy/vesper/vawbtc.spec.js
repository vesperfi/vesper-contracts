'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('vaWBTC Pool with FraxLendVesperXy strategy', function () {
  testRunner('VAWBTC', ['FraxLend_Vesper_Xy_WBTC_FRAX'], [{ debtRatio: 9000 }])
})
