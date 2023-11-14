'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Extra Finance strategy', function () {
  testRunner('VAUSDC', ['ExtraFinance_USDC'], [{ debtRatio: 9000 }])
})
