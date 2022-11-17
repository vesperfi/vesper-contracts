'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Compound_Vesper_Xy_DAI_USDC'], [{ debtRatio: 9000 }])
})
