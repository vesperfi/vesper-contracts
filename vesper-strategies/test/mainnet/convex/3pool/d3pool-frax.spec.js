'use strict'

const testRunner = require('../../../utils/testRunner')

// d3pool_FRAX is closed
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('d3pool VAFRAX Pool', function () {
  testRunner('VAFRAX', ['Convex_d3pool_FRAX'], [{ debtRatio: 9000 }])
})
