'use strict'

const testRunner = require('../../utils/testRunner')

describe('vaFrax Pool with FraxLend strategy', function () {
  testRunner('VAFRAX', ['FraxLend_CRV_FRAX'], [{ debtRatio: 10000 }])
})
