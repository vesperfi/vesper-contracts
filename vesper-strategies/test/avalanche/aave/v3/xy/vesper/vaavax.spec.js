'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['AaveV3_Vesper_Xy_AVAX_DAIe'], [{ debtRatio: 9000 }])
})
