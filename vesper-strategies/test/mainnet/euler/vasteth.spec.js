'use strict'

const testRunner = require('../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VASTETH Pool with Euler Strategy', function () {
  testRunner('VASTETH', ['Euler_STETH'], [{ debtRatio: 9000 }])
})
