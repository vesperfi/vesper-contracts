'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAUSDC Pool with Morpho USDC Vault strategy', function () {
  testRunner('VAUSDC', ['Morpho_GrauntletUSDCCore_Vault_USDC'], [{ debtRatio: 10000 }])
})
