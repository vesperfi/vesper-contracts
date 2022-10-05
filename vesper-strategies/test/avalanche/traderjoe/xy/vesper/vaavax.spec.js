'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAAVAX Pool', function () {
  testRunner('VAAVAX', ['TraderJoe_Vesper_Xy_AVAX_WETHe'], [{ debtRatio: 9500 }])
})
