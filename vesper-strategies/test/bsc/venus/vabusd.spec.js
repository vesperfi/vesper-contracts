'use strict'

const testRunner = require('../../utils/testRunner')

describe('VABUSD Pool with Venus strategy', function () {
  testRunner('VABUSD', ['Venus_BUSD'], [{ debtRatio: 9000 }])
})
