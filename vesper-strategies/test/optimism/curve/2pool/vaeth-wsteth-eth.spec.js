'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Curve_wstETH_ETH'], [{ debtRatio: 10000 }])
})
