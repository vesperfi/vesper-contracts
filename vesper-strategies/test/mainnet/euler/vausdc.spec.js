'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool with EulerV2 strategy', function () {
  testRunner('VAUSDC', ['EulerV2_Euler_Prime_USDC'], [{ debtRatio: 9000 }])
})
