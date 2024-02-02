'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VARETH Pool', function () {
  testRunner('VARETH', ['AaveV3_Sommelier_Xy_RETH_WETH'], [{ debtRatio: 9000 }])
})
