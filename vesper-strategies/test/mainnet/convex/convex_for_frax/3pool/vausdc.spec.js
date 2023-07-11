'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAUSDC Pool with eUSD-FRAXBP ConvexForFrax', function () {
  testRunner('VAUSDC', ['ConvexForFrax_eusdfraxbp_USDC'], [{ debtRatio: 10000 }])
})
