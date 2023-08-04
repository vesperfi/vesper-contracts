'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VAOP Pool', function () {
  testRunner('VAOP', ['Sonne_Vesper_Xy_OP_USDC'], [{ debtRatio: 9000 }])
})
