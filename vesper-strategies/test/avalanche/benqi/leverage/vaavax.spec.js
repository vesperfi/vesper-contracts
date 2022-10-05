'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['Benqi_Leverage_AVAX'], [{ debtRatio: 9000 }])
})
