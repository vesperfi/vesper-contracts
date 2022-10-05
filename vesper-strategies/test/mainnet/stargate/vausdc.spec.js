'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Stargate_USDC'], [{ debtRatio: 9000 }])
})
