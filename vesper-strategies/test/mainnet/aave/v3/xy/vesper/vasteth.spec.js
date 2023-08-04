'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VASTETH Pool', function () {
  testRunner('VASTETH', ['AaveV3_Vesper_Xy_STETH_USDC'], [{ debtRatio: 9000 }])
})
