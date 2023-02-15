'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Compound_Vesper_Xy_ETH_WBTC'], [{ debtRatio: 9000 }])
  testRunner('VAETH', ['Compound_Vesper_Xy_ETH_DAI'], [{ debtRatio: 9000 }])
})
