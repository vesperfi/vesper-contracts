'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAWBTCe Pool', function () {
  testRunner('VAWBTCe', ['Benqi_Vesper_Xy_WBTCe_WETHe'], [{ debtRatio: 9000 }])
})
