'use strict'

const testRunner = require('../../../utils/testRunner')

describe('d3pool VAFEI Pool', function () {
  testRunner('VAFEI', ['Convex_d3pool_FEI'], [{ debtRatio: 9500 }])
})
