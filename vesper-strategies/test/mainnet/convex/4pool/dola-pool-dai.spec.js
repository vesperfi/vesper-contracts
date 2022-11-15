'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAI Pool', function () {
  testRunner('VADAI', ['Convex_dola_DAI'], [{ debtRatio: 10000 }])
})
