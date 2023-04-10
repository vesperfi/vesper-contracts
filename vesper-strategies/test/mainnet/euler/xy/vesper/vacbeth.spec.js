'use strict'

const testRunner = require('../../../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VACBETH Pool with Euler Vesper XY Strategy', function () {
  testRunner('VACBETH', ['Euler_Vesper_Xy_CBETH_USDC'], [{ debtRatio: 9000 }])
})
