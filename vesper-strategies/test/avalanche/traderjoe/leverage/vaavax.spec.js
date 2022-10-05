'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['TraderJoe_Leverage_AVAX'], [{ debtRatio: 9000 }])
})
