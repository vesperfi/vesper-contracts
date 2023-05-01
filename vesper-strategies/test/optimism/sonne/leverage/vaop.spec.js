'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAOP Pool with Sonne Leverage strategy', function () {
  testRunner('VAOP', ['Sonne_Leverage_OP'], [{ debtRatio: 9000 }])
})
