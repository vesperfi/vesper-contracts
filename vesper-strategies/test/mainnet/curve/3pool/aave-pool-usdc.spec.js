'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Curve_aave_USDC'], [{ debtRatio: 10000 }])
})
