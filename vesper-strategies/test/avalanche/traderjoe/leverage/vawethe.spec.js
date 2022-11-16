'use strict'

const testRunner = require('../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAWETHe Pool', function () {
  testRunner('VAWETHe', ['TraderJoe_Leverage_WETHe'], [{ debtRatio: 9000 }])
})
