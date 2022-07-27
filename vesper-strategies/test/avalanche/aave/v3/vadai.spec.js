'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VADAIe Pool', function () {
  testRunner('VADAIe', ['AaveV3DAIe'], [{ debtRatio: 9000 }])
})
