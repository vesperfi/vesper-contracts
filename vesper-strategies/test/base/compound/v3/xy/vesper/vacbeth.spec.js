'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('vacbETH Pool', function () {
  testRunner('vacbETH', ['CompoundV3_Vesper_Xy_cbETH_ETH'], [{ debtRatio: 9000 }])
  testRunner('vacbETH', ['CompoundV3_Vesper_Xy_cbETH_USDC'], [{ debtRatio: 9000 }])
})
