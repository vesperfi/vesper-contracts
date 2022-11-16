'use strict'

const testRunner = require('../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['TraderJoe_Leverage_AVAX'], [{ debtRatio: 9000 }])
})
