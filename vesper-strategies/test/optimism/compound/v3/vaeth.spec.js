'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool with CompoundV3 strategy', function () {
  testRunner('VAETH', ['CompoundV3_ETH'], [{ debtRatio: 9000 }])
})
