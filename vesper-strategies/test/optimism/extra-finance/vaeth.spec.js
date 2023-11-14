'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Extra Finance strategy', function () {
  testRunner('VAETH', ['ExtraFinance_ETH'], [{ debtRatio: 9000 }])
})
