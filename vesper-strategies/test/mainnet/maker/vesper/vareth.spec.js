'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VARETH Pool', function () {
  testRunner('VARETH', ['Maker_Vesper_RETH'], [{ debtRatio: 9000 }])
})
