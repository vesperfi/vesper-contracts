'use strict'

const testRunner = require('../../utils/testRunner')

describe('VASTETH Pool with Euler Strategy', function () {
  testRunner('VASTETH', ['Euler_STETH'], [{ debtRatio: 9000 }])
})
