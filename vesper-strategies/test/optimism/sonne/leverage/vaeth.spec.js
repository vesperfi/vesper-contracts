'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool with Sonne Leverage strategy', function () {
  testRunner('VAETH', ['Sonne_Leverage_ETH'], [{ debtRatio: 9000 }])
})
