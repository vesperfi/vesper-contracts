'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VABUSD Pool with DotDot val tri pool', function () {
  testRunner('VABUSD', ['DotDot_Val3Pool_BUSD'], [{ debtRatio: 10000 }])
})
