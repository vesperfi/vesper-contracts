'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAUSDC Pool', function () {
  testRunner('VAUSDC', ['TraderJoe_USDC'], [{ debtRatio: 9000 }])
})
