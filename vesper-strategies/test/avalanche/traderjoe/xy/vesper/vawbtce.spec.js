'use strict'

const testRunner = require('../../../../utils/testRunner')

// Borrow is paused in TraderJoe
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['TraderJoe_Vesper_Xy_WBTCe_USDCe'], [{ debtRatio: 9500 }])
  testRunner('VAWBTCe', ['TraderJoe_Vesper_Xy_WBTCe_WETHe'], [{ debtRatio: 9500 }])
})
