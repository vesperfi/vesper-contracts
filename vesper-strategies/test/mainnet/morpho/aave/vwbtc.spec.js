'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VWBTC Pool with Morpho AaveV2 strategy', function () {
  testRunner('VWBTC', ['Morpho_AaveV2_WBTC'], [{ debtRatio: 9000 }])
})
