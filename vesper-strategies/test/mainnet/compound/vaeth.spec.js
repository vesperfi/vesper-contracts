'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Compound_ETH'], [{ debtRatio: 9000 }])
})
