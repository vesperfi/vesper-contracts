'use strict'

const testRunner = require('../../../utils/testRunner')

describe('ren VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['Curve_ren_WBTCe'], [{ debtRatio: 10000 }])
})
