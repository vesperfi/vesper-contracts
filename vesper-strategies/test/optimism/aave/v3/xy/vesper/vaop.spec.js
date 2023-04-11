'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAOP Pool', function () {
  testRunner('VAOP', ['AaveV3_Vesper_Xy_OP_USDC'], [{ debtRatio: 9000 }])
})
