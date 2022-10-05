'use strict'

const testRunner = require('../../utils/testRunner')

describe('VADAIe Pool', function () {
  testRunner('VADAIe', ['Benqi_DAIe'], [{ debtRatio: 9500 }])
})
