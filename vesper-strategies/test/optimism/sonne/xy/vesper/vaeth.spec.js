'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['Sonne_Vesper_Xy_ETH_USDC'], [{ debtRatio: 9000 }])
})
