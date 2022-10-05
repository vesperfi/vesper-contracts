'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAQI Pool', function () {
  testRunner('VAQI', ['Benqi_QI'], [{ debtRatio: 9600 }])
})
