'use strict'

const testRunner = require('../../utils/testRunner')

describe('VADAI Pool with Alpha Homora strategy', function () {
  testRunner('VADAI', ['Alpha_Homora_DAI'], [{ debtRatio: 9000 }])
})
