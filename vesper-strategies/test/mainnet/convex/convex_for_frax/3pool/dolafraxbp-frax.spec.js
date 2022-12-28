'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('dolafraxbp VAFRAX Pool', function () {
  testRunner('VAFRAX', ['ConvexForFrax_dolafraxbp_FRAX'], [{ debtRatio: 10000 }])
})
