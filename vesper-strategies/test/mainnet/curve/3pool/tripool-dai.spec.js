'use strict'

const testRunner = require('../../../utils/testRunner')

describe('tripool VADAI Pool', function () {
  testRunner('VADAI', ['Curve_3pool_DAI'], [{ debtRatio: 10000 }])
})
