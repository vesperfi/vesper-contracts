'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VASTETH Pool', function () {
  testRunner('VASTETH', ['Maker_Vesper_STETH'], [{ debtRatio: 9000 }])
})
