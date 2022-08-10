'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['Benqi_Leverage_WBTCe'], [{ debtRatio: 9000 }])
})
