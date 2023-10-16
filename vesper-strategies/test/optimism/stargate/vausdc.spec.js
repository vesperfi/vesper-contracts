'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Stargate strategy', function () {
  testRunner('VAUSDC', ['Stargate_USDC'], [{ debtRatio: 9000 }])
})
