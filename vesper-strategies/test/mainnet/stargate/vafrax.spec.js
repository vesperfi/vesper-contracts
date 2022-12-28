'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAFRAX Pool', function () {
  testRunner('VAFRAX', ['Stargate_FRAX'], [{ debtRatio: 9000 }])
})
