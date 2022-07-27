'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Aave_V2_USDC'], [{ debtRatio: 9000 }])
})
