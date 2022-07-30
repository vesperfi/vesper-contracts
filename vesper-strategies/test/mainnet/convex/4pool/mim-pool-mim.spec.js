'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VMIM Pool', function () {
  testRunner('VMIM', ['Convex_mim_MIM'], [{ debtRatio: 10000 }])
})
