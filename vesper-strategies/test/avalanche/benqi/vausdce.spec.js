'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDCe Pool', function () {
  testRunner('VAUSDCe', ['Benqi_USDCe'], [{ debtRatio: 9500 }])
})
