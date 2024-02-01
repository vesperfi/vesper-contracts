'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Extra Finance strategy', function () {
  testRunner('VAETH', ['ExtraFinance_ETH_1'], [{ debtRatio: 9000 }])
  testRunner('VAETH', ['ExtraFinance_ETH_2'], [{ debtRatio: 9000 }])
})
