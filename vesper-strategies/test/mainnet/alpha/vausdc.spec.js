'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with Alpha Homora strategy', function () {
  testRunner('VAUSDC', ['Alpha_Homora_USDC'], [{ debtRatio: 9000 }])
})
