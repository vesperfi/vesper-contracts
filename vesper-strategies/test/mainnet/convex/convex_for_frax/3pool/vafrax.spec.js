'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAFRAX Pool with ConvexForFrax', function () {
  testRunner('VAFRAX', ['ConvexForFrax_eusdfraxbp_FRAX'], [{ debtRatio: 10000 }])
  testRunner('VAFRAX', ['ConvexForFrax_DolaFraxPyusd_FRAX'], [{ debtRatio: 10000 }])
})
