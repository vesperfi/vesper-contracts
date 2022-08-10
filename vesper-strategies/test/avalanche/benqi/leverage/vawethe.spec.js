'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWETHe Pool', function () {
  testRunner('VAWETHe', ['Benqi_Leverage_WETHe'], [{ debtRatio: 9000 }])
})
