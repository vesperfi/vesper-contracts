'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Compound_USDC'], [{ debtRatio: 9000 }])
})
