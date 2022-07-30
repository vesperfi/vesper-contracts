'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAFRAX Pool', function () {
  testRunner('VAFRAX', ['Convex_frax_FRAX'], [{ debtRatio: 10000 }])
})
