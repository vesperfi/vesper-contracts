'use strict'

const testRunner = require('../../../utils/testRunner')

describe('VAETH Pool with Morpho ETH Vault strategy', function () {
  testRunner('VAETH', ['Morpho_IndexCoopHyETH_Vault_ETH'], [{ debtRatio: 10000 }])
})
