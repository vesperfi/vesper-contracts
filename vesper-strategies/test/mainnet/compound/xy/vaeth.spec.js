'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Compound_Xy_ETH_DAI'], [{ debtRatio: 9000 }])
})
