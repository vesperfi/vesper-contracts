'use strict'

const testRunner = require('../../utils/testRunner')

describe('VABNB Pool with Alpaca strategy', function () {
  testRunner('VABNB', ['Alpaca_BNB'], [{ debtRatio: 9000 }])
})
