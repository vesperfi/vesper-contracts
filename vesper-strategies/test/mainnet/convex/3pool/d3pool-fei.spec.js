'use strict'

const testRunner = require('../../../utils/testRunner')

// d3pool_FEI is closed
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('d3pool VAFEI Pool', function () {
  testRunner('VAFEI', ['Convex_d3pool_FEI'], [{ debtRatio: 9500 }])
})
