'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Curve_sETH_ETH'], [{ debtRatio: 10000 }])
})
