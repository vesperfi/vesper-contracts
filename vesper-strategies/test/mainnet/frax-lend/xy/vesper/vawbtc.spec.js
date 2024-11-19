'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('vaWBTC Pool with FraxlendVesperXy strategy', function () {
  testRunner('VAWBTC', ['Fraxlend_Vesper_Xy_WBTC_FRAX'], [{ debtRatio: 9000 }])
})
