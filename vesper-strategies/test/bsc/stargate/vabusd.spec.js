'use strict'

const testRunner = require('../../utils/testRunner')

describe('VABUSD Pool with Stargate strategy', function () {
  testRunner('VABUSD', ['Stargate_BUSD'], [{ debtRatio: 9000 }])
})
