'use strict'

const testRunner = require('../../../utils/testRunner')

describe('mim-3crv VMIM Pool', function () {
  testRunner('VMIM', ['Curve_mim_MIM'], [{ debtRatio: 10000 }])
})
