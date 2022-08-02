'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAFRAX Pool', function () {
  testRunner('VAFRAX', ['Convex_d3pool_FRAX'], [{ debtRatio: 9000 }])
})
