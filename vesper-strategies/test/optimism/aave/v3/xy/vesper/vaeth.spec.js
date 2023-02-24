'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['AaveV3_Vesper_Xy_ETH_USDC'], [{ debtRatio: 9000 }])
})
