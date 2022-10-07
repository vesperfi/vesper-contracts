'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['AaveV2_Vesper_Xy_ETH_DAI'], [{ debtRatio: 9000 }])
  // testRunner('VAETH', ['AaveV2_Vesper_Xy_ETH_FEI'], [{ debtRatio: 9000 }])
})
