'use strict'

const testRunner = require('../../../../utils/testRunner')

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAETH Pool with Euler Vesper XY Strategy', function () {
  testRunner('VAETH', ['Euler_Vesper_Xy_ETH_USDC'], [{ debtRatio: 9000 }])
  testRunner('VAETH', ['Euler_Vesper_Xy_ETH_DAI'], [{ debtRatio: 9000 }])
})
