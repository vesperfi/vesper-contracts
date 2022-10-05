'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['Benqi_AVAX'], [{ debtRatio: 9800 }])
})
