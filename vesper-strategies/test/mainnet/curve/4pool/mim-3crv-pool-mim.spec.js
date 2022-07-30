'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VMIM Pool', function () {
  testRunner('VMIM', ['Curve_mim_MIM'], [{ debtRatio: 10000 }])
})
