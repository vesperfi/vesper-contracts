'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAI Pool with Morpho AaveV2 strategy', function () {
  testRunner('VADAI', ['Morpho_AaveV2_DAI'], [{ debtRatio: 9800 }])
})
