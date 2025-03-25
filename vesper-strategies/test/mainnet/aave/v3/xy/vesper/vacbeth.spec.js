'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VACBETH Pool', function () {
  testRunner('VACBETH', ['AaveV3_Vesper_Xy_CBETH_DAI'], [{ debtRatio: 9000 }])
  testRunner('VACBETH', ['AaveV3_Vesper_Xy_CBETH_USDC'], [{ debtRatio: 9000 }])
  testRunner('VACBETH', ['AaveV3_Vesper_Xy_CBETH_WETH'], [{ debtRatio: 9000 }])
})
