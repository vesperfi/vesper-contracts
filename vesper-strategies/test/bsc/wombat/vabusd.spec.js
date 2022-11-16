'use strict'

const testRunner = require('../../utils/testRunner')

describe('VABUSD Pool with Wombat strategy', function () {
  testRunner('VABUSD', ['Wombat_BUSD'], [{ debtRatio: 9000 }])
})
