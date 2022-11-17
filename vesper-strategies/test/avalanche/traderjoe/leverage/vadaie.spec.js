'use strict'

const testRunner = require('../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VADAIe Pool', function () {
  testRunner('VADAIe', ['TraderJoe_Leverage_DAIe'], [{ debtRatio: 9000 }])
})
