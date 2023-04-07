'use strict'

const testRunner = require('../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAETH Pool with Euler Strategy', function () {
  testRunner('VAETH', ['Euler_ETH'], [{ debtRatio: 9000 }])
})
