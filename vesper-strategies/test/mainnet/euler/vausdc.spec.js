'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Euler strategy', function () {
  testRunner('VAUSDC', ['Euler_USDC'], [{ debtRatio: 9000 }])
})
