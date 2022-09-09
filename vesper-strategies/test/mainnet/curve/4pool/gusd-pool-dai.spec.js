'use strict'

const testRunner = require('../../../utils/testRunner')

describe('gusd VADAI Pool', function () {
  testRunner('VADAI', ['Curve_GUSD_DAI'], [{ debtRatio: 10000 }])
})
