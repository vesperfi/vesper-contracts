'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Morpho Usual Boosted USDC Vault strategy', function () {
  testRunner('VAUSDC', ['Morpho_UsualBoostedUSDC_Vault_USDC'], [{ debtRatio: 9000 }])
})
