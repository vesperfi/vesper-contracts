'use strict'

const testRunner = require('../../../utils/testRunner')

describe('frax VADAI Pool', function () {
  testRunner('VADAI', ['Convex_frax_DAI'], [{ debtRatio: 10000 }])
})
