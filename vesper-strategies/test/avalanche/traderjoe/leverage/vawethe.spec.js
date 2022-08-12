'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWETHe Pool', function () {
  testRunner('VAWETHe', ['TraderJoe_Leverage_WETHe'], [{ debtRatio: 9000 }])
})
