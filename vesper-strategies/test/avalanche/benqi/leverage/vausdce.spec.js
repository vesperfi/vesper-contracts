'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDCe Pool', function () {
  testRunner('VAUSDCe', ['Benqi_Leverage_USDCe'], [{ debtRatio: 9000 }])
})
