'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VASTETH Pool', function () {
  testRunner('VASTETH', ['Vesper-Aave-STETH-DAI'], [{ debtRatio: 9000 }])
})
