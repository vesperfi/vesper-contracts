'use strict'

const testRunner = require('../../utils/testRunner')

describe('VACBETH Pool with Euler Strategy', function () {
  testRunner('VACBETH', ['Euler_CBETH'], [{ debtRatio: 9000 }])
})
