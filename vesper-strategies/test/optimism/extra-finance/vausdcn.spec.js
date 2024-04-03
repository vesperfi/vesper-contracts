'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDCn Pool with Extra Finance  strategy', function () {
  testRunner('VAUSDCn', ['ExtraFinance_USDCn_1'], [{ debtRatio: 9000 }])
  testRunner('VAUSDCn', ['ExtraFinance_USDCn_2'], [{ debtRatio: 9000 }])
})
