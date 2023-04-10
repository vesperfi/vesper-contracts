'use strict'

const testRunner = require('../../../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VADAI Pool with Euler Vesper XY Strategy', function () {
  testRunner('VADAI', ['Euler_Vesper_Xy_DAI_USDC'], [{ debtRatio: 9000 }])
})
