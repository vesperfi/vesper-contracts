'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VASTETH Pool', function () {
  testRunner('VASTETH', ['AaveV2_Vesper_Xy_stETH_DAI'], [{ debtRatio: 9000 }])
})
