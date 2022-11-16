'use strict'

const testRunner = require('../../../utils/testRunner')

describe('aave VADAI Pool', function () {
  testRunner('VADAI', ['Curve_aave_DAI'], [{ debtRatio: 10000 }])
})
