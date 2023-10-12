'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAETH Pool with Morpho AaveV3 strategy', function () {
  testRunner('VAETH', ['Morpho_AaveV3_WETH'], [{ debtRatio: 9000 }])
})
