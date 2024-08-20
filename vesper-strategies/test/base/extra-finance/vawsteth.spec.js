'use strict'

const testRunner = require('../../utils/testRunner')

describe('vawstETH Pool with Extra Finance strategy', function () {
  testRunner('vawstETH', ['ExtraFinance_wstETH_1'], [{ debtRatio: 9000 }])
})
