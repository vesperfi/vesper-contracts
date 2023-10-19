'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Morpho Compound strategy', function () {
  testRunner('VAUSDC', ['Morpho_Compound_USDC'], [{ debtRatio: 9000 }])
})
