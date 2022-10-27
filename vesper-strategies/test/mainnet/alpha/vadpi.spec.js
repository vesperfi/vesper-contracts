'use strict'

const testRunner = require('../../utils/testRunner')

describe('VADPI Pool with Alpha Homora strategy', function () {
  testRunner('VADPI', ['Alpha_Homora_DPI'], [{ debtRatio: 9000 }])
})
