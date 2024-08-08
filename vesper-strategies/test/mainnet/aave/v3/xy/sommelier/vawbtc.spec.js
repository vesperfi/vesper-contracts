'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['AaveV3_Sommelier_Xy_WBTC_WETH'], [{ debtRatio: 9500 }])
})
