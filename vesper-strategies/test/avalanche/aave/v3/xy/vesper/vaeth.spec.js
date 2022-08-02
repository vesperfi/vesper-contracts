'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAWETHe Pool', function () {
  testRunner('VAWETHe', ['AaveV3_Vesper_Xy_ETH_DAIe'], [{ debtRatio: 9000 }])
})
