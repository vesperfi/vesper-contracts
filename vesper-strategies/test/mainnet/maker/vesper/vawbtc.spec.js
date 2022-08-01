'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['Maker_Vesper_WBTC'], [{ debtRatio: 9000 }])
})
