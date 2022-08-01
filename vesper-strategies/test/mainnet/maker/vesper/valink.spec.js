'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VALINK Pool', function () {
  testRunner('VALINK', ['Maker_Vesper_LINK'], [{ debtRatio: 9000 }])
})
