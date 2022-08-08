'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Maker_Vesper_ETH'], [{ debtRatio: 9000 }])
})
