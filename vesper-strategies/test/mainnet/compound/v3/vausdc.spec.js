'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['CompoundV3_USDC'], [{ debtRatio: 9000 }])
})
