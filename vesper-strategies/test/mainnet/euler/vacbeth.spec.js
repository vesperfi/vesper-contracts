'use strict'

const testRunner = require('../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VACBETH Pool with Euler Strategy', function () {
  testRunner('VACBETH', ['Euler_CBETH'], [{ debtRatio: 9000 }])
})
