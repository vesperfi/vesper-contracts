'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Extra Finance strategy', function () {
  testRunner('VAUSDC', ['ExtraFinance_USDC_1'], [{ debtRatio: 9000 }])
  testRunner('VAUSDC', ['ExtraFinance_USDC_2'], [{ debtRatio: 9000 }])
})
