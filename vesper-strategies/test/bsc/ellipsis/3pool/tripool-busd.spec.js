'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VABUSD Pool with Ellipsis val tri pool', function () {
  testRunner('VABUSD', ['Ellipsis_Val3Pool_BUSD'], [{ debtRatio: 10000 }])
})
