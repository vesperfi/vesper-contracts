'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAWBTC Pool', function () {
  testRunner('VAWBTC', ['AaveV2VesperXyWBTC_FEI'], [{ debtRatio: 9000 }])
  testRunner('VAWBTC', ['AaveV2VesperXyWBTC_FRAX'], [{ debtRatio: 9000 }])
})
