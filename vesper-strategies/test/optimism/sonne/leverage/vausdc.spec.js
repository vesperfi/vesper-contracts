'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Sonne Leverage strategy', function () {
  testRunner('VAUSDC', ['Sonne_Leverage_USDC'], [{ debtRatio: 9000 }])
})
