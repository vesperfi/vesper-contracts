'use strict'

const testRunner = require('../../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['TraderJoe_Vesper_Xy_AVAX_WETHe'], [{ debtRatio: 9500 }])
})
