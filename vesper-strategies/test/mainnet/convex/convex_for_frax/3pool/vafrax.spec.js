'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAFRAX Pool with eUSD-FRAXBP ConvexForFrax', function () {
  testRunner('VAFRAX', ['ConvexForFrax_eusdfraxbp_FRAX'], [{ debtRatio: 10000 }])
})
