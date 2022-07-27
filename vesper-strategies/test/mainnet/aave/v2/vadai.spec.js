'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Aave_V2_DAI'], [{ debtRatio: 9000 }])
})
