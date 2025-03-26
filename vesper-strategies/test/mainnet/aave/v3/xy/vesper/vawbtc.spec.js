'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAWBTC Pool with AaveV3 Vesper borrow strategy', function () {
  testRunner('VAWBTC', ['AaveV3_Vesper_Xy_WBTC_WETH'], [{ debtRatio: 9500 }])
})
