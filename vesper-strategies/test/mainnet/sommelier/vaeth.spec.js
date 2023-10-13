'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Sommelier strategy', function () {
  testRunner('VAETH', ['Sommelier_ETH'], [{ debtRatio: 10000 }])
})
