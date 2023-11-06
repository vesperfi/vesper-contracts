'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Morpho AaveV2 strategy', function () {
  testRunner('VAUSDC', ['Morpho_AaveV2_USDC'], [{ debtRatio: 9000 }])
})
