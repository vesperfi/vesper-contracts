'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Curve_sUSD_DAI'], [{ debtRatio: 10000 }])
})
