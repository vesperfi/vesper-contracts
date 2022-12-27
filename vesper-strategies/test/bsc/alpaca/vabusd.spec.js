'use strict'

const testRunner = require('../../utils/testRunner')

describe('VABUSD Pool with Alpaca strategy', function () {
  testRunner('VABUSD', ['Alpaca_BUSD'], [{ debtRatio: 9000 }])
})
