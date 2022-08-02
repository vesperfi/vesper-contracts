'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Convex_frax_DAI'], [{ debtRatio: 10000 }])
})
