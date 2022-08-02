'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Convex_frax_USDC'], [{ debtRatio: 10000 }])
})
