'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAWETHe Pool', function () {
  testRunner('VAWETHe', ['TraderJoe_WETHe'], [{ debtRatio: 9000 }])
})
