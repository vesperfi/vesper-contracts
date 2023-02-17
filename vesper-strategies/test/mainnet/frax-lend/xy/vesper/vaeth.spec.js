'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('vaETH Pool with FraxLendVesperXy strategy', function () {
  testRunner('VAETH', ['FraxLend_Vesper_Xy_ETH_FRAX'], [{ debtRatio: 9000 }])
})
