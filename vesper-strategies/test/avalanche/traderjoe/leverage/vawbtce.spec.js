'use strict'

const testRunner = require('../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['TraderJoe_Leverage_WBTCe'], [{ debtRatio: 9000 }])
})
