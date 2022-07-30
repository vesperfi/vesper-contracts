'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAFEI Pool', function () {
  testRunner('VAFEI', ['Convex_d3pool_FEI'], [{ debtRatio: 9500 }])
})
