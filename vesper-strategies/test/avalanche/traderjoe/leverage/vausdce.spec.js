'use strict'

const testRunner = require('../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAUSDCe Pool', function () {
  testRunner('VAUSDCe', ['TraderJoe_Leverage_USDCe'], [{ debtRatio: 9000 }])
})
