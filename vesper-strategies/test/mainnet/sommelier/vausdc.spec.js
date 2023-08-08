'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Sommelier strategy', function () {
  testRunner('VAUSDC', ['Sommelier_USDC'], [{ debtRatio: 10000 }])
})
