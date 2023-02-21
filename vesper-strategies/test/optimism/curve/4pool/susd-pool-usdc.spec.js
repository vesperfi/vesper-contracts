'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC with Curve sUSD Pool', function () {
  testRunner('VAUSDC', ['Curve_sUSD_USDC'], [{ debtRatio: 10000 }])
})
