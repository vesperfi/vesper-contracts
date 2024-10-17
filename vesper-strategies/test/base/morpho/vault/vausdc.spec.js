'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vaUSDC Pool with Moonwell flagship USDC Vault strategy', function () {
  testRunner('vaUSDC', ['Morpho_MoonwellFlagshipUSDC_Vault_USDC'], [{ debtRatio: 10000 }])
})
