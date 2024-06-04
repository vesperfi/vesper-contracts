'use strict'

const testRunner = require('../../utils/testRunner')

describe('vaETH Pool with Stargate strategy', function () {
  testRunner('vaETH', ['Stargate_ETH'], [{ debtRatio: 9000 }])
})
