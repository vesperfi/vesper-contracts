'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Benqi_USDC'], [{ debtRatio: 9500 }])
})
