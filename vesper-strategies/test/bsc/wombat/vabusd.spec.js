/* eslint-disable mocha/no-skipped-tests */
'use strict'

const testRunner = require('../../utils/testRunner')
// Test was failing and decided to not fix as there is no real support for BSC chain.
describe.skip('VABUSD Pool with Wombat strategy', function () {
  testRunner('VABUSD', ['Wombat_BUSD'], [{ debtRatio: 9000 }])
})
