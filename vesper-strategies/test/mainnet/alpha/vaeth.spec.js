'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool with Alpha Homora strategy', function () {
  testRunner('VAETH', ['Alpha_Homora_ETH'], [{ debtRatio: 9000 }])
})
