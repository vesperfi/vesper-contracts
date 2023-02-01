'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VABUSD Pool with Venus Vesper XY strategy', function () {
  testRunner('VABUSD', ['Venus_Vesper_Xy_BUSD_BNB'], [{ debtRatio: 9000 }])
})
