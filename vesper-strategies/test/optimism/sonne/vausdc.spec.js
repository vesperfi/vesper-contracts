'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Sonne strategy', function () {
  testRunner('VAUSDC', ['Sonne_USDC'], [{ debtRatio: 9000 }])
})
