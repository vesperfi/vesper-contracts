'use strict'

const testRunner = require('../../../../../utils/testRunner')

// Due to isolation mode of OP on Aave, there is some issue in borrowing USDC
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('VAOP Pool', function () {
  testRunner('VAOP', ['AaveV3_Vesper_Xy_OP_USDC'], [{ debtRatio: 9000 }])
})
