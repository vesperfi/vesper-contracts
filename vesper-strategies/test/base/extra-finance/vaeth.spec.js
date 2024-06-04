'use strict'

const testRunner = require('../../utils/testRunner')

describe('vaETH Pool with Extra Finance strategy', function () {
  testRunner('vaETH', ['ExtraFinance_ETH_1'], [{ debtRatio: 9000 }])
  testRunner('vaETH', ['ExtraFinance_ETH_LRT'], [{ debtRatio: 9000 }])
})
