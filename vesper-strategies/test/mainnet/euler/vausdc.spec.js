'use strict'

const testRunner = require('../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAUSDC Pool with Euler strategy', function () {
  testRunner('VAUSDC', ['Euler_USDC'], [{ debtRatio: 9000 }])
})
