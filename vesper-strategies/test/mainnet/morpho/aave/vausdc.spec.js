'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Morpho Aave strategy', function () {
  testRunner('VAUSDC', ['Morpho_Aave_USDC'], [{ debtRatio: 9000 }])
})
