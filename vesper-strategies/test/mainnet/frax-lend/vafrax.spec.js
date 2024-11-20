'use strict'

const testRunner = require('../../utils/testRunner')

describe('vaFrax Pool with Fraxlend strategy', function () {
  testRunner('VAFRAX', ['Fraxlend_CRV_FRAX'], [{ debtRatio: 10000 }])
  testRunner('VAFRAX', ['Fraxlend_sfrxETH_FRAX'], [{ debtRatio: 10000 }])
})
