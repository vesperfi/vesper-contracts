'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vamsETH Pool with Morpho Metronome msETH Vault strategy', function () {
  testRunner('vamsETH', ['Morpho_MetronomeMsETH_Vault_msETH'], [{ debtRatio: 10000 }])
})
