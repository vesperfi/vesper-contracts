'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Aave deposit strategy', function () {
  testRunner('VAUSDC', ['AaveV3_USDCe'], [{ debtRatio: 9000 }])
})
