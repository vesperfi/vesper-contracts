'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Euler Strategy', function () {
  testRunner('VAETH', ['Euler_ETH'], [{ debtRatio: 9000 }])
})
