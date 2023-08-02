'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VARETH Pool', function () {
  testRunner('VARETH', ['AaveV3_Vesper_Xy_RETH_USDC'], [{ debtRatio: 9000 }])
})
