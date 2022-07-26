'use strict'

const testRunner = require('../../utils/testRunner')

describe('VADAIe Pool', function () {
  testRunner('VADAIe', ['AaveV3StrategyDAIe'], [{ debtRatio: 9000 }])
})
