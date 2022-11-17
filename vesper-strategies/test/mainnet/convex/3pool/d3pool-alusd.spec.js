'use strict'

const testRunner = require('../../../utils/testRunner')

// d3pool_AlUSD is closed
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('d3pool VAALUSD Pool', function () {
  testRunner('VAALUSD', ['Convex_d3pool_AlUSD'], [{ debtRatio: 9500 }])
})
