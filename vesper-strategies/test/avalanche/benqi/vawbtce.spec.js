'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['Benqi_WBTCe'], [{ debtRatio: 9000 }])
})
