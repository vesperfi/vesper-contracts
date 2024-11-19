'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('vaETH Pool with FraxlendVesperXy strategy', function () {
  testRunner('VAETH', ['Fraxlend_Vesper_Xy_ETH_FRAX'], [{ debtRatio: 9000 }])
})
