'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Stargate strategy', function () {
  testRunner('VAETH', ['Stargate_ETH'], [{ debtRatio: 9000 }])
})
