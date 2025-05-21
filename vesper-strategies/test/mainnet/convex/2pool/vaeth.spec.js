'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool with Convex strategy', function () {
  testRunner('VAETH', ['Convex_ynETHx_WETH'], [{ debtRatio: 10000 }])
})
