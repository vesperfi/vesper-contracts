'use strict'

const testRunner = require('../../utils/testRunner')

describe('vaUSDC Pool with Extra Finance strategy', function () {
  testRunner('vaUSDC', ['ExtraFinance_USDC_1'], [{ debtRatio: 9000 }])
  testRunner('vaUSDC', ['ExtraFinance_USDC_2'], [{ debtRatio: 9000 }])
})
