'use strict'

const testRunner = require('../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Yearn_ETH'], [{ debtRatio: 9000 }])
})
