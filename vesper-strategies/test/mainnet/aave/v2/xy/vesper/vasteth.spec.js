'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VASTETH Pool', function () {
  testRunner('VASTETH', ['Aave-Vesper-STETH-DAI'], [{ debtRatio: 9000 }])
})
