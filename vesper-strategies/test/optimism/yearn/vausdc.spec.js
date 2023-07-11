'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['Yearn_USDC'], [{ debtRatio: 9000 }])
})
