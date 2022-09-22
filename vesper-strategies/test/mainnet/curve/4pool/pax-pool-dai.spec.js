'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Curve_pax_DAI'], [{ debtRatio: 10000 }])
})
