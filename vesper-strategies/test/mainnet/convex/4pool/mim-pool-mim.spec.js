'use strict'

const testRunner = require('../../../utils/testRunner')

describe('mim VMIM Pool', function () {
  testRunner('VMIM', ['Convex_mim_MIM'], [{ debtRatio: 10000 }])
})
