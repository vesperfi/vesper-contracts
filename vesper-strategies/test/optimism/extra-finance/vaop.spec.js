'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAOP Pool with Extra Finance strategy', function () {
  testRunner('VAOP', ['ExtraFinance_OP'], [{ debtRatio: 9000 }])
})
