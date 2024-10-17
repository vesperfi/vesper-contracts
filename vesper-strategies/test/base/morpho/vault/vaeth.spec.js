'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vaETH Pool with morpho vault strategy', function () {
  testRunner('vaETH', ['Morpho_MoonwellFlagshipETH_Vault_ETH'], [{ debtRatio: 10000 }])
  testRunner('vaETH', ['Morpho_Re7WETH_Vault_WETH'], [{ debtRatio: 10000 }])
})
