'use strict'

const testRunner = require('../../../utils/testRunner')

// Market borrow cap is reaching in tests
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['Benqi_Leverage_WBTCe'], [{ debtRatio: 9000 }])
})
