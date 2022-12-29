'use strict'

const testRunner = require('../../../../../utils/testRunner')

describe('VALINK Pool', function () {
  testRunner('VALINK', ['CompoundV3_Vesper_Xy_LINK_USDC'], [{ debtRatio: 9000 }])
})
