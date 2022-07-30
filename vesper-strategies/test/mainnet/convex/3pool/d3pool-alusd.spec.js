'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAALUSD Pool', function () {
  testRunner('VAALUSD', ['Convex_d3pool_AlUSD'], [{ debtRatio: 9500 }])
})
