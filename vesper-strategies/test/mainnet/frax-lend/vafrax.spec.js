'use strict'

const testRunner = require('../../utils/testRunner')

describe('vaFrax Pool with FraxLend strategy', function () {
  testRunner('VAFRAX', ['FraxLend_CRV_FRAX'], [{ debtRatio: 10000 }])
  testRunner('VAFRAX', ['Fraxlend_sfrxETH_FRAX'], [{ debtRatio: 10000 }])
})
