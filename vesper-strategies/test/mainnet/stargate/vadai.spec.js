'use strict'

const testRunner = require('../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Stargate_DAI'], [{ debtRatio: 9000 }])
})
