'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VAETH Pool', function () {
  testRunner('VAETH', ['AaveV2VesperXyETH_DAI'], [{ debtRatio: 9000 }])
  testRunner('VAETH', ['AaveV2VesperXyETH_FEI'], [{ debtRatio: 9000 }])
})
