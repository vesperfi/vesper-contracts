'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('dolafraxbp VAUSDC Pool', function () {
  testRunner('VAUSDC', ['ConvexForFrax_dolafraxbp_USDC'], [{ debtRatio: 10000 }])
})
