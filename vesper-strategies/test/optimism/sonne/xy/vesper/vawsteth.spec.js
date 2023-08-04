'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('vawstETH Pool', function () {
  testRunner('vawstETH', ['Sonne_Vesper_Xy_wstETH_USDC'], [{ debtRatio: 9000 }])
})
