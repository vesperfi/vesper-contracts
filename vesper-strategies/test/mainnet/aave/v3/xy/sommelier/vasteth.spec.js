'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VASTETH Pool', function () {
  testRunner('VASTETH', ['AaveV3_Sommelier_Xy_STETH_WETH'], [{ debtRatio: 9800 }])
})
