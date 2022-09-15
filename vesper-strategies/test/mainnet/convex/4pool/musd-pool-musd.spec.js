'use strict'

const testRunner = require('../../../utils/testRunner')

describe('musd VAMUSD Pool', function () {
  testRunner('VAMUSD', ['Convex_musd_MUSD'], [{ debtRatio: 10000 }])
})
