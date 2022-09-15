'use strict'

const testRunner = require('../../../utils/testRunner')

describe('d3pool VAALUSD Pool', function () {
  testRunner('VAALUSD', ['Convex_d3pool_AlUSD'], [{ debtRatio: 9500 }])
})
