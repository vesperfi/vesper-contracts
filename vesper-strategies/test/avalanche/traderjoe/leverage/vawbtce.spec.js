'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['TraderJoe_Leverage_WBTCe'], [{ debtRatio: 9000 }])
})
