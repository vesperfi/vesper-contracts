'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('fraxusdc VAUSDC Pool', function () {
  testRunner('VAUSDC', ['ConvexForFrax_fraxusdc_USDC'], [{ debtRatio: 10000 }])
})
