'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VALINK Pool', function () {
  testRunner('VALINK', ['AaveV2_Vesper_Xy_LINK_USDC'], [{ debtRatio: 9000 }])
})
