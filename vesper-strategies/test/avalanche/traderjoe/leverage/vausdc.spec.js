'use strict'

const testRunner = require('../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['TraderJoe_Leverage_USDC'], [{ debtRatio: 9000 }])
})
