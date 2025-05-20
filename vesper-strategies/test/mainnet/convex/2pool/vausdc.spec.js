'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Convex eUSD_USDC strategy', function () {
  testRunner('VAUSDC', ['Convex_eUSD_USDC'], [{ debtRatio: 10000 }])
})
