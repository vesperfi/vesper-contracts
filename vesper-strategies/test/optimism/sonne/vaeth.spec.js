'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Sonne strategy', function () {
  testRunner('VAETH', ['Sonne_ETH'], [{ debtRatio: 9000 }])
})
