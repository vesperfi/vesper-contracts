'use strict'

const testRunner = require('../../../utils/testRunner')

describe('tripool VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Curve_3pool_USDC'], [{ debtRatio: 10000 }])
})
