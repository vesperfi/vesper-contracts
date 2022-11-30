'use strict'

const testRunner = require('../../../../utils/testRunner')

describe('VABNB Pool with Venus Vesper XY strategy', function () {
  testRunner('VABNB', ['Venus_Vesper_Xy_BNB_BUSD'], [{ debtRatio: 9000 }])
})
