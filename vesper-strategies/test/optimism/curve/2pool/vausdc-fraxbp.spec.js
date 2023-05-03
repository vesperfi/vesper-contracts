'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Curve FRAXBP pool', function () {
  testRunner('VAUSDC', ['Curve_FRAXBP_USDC'], [{ debtRatio: 10000 }])
})
