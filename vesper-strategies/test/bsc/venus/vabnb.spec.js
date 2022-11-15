'use strict'

const testRunner = require('../../utils/testRunner')

describe('VABNB Pool with Venus strategy', function () {
  testRunner('VABNB', ['Venus_BNB'], [{ debtRatio: 9000 }])
})
