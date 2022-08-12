'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAIe Pool', function () {
  testRunner('VADAIe', ['TraderJoe_Leverage_DAIe'], [{ debtRatio: 9000 }])
})
