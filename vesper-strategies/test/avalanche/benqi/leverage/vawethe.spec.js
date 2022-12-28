'use strict'

const testRunner = require('../../../utils/testRunner')

// Market borrow cap is reaching in tests
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAWETHe Pool', function () {
  testRunner('VAWETHe', ['Benqi_Leverage_WETHe'], [{ debtRatio: 9000 }])
})
