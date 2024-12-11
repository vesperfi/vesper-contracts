'use strict'

const testRunner = require('../../../utils/testRunner')

describe('vamsUSD Pool with Morpho Metronome msUSD Vault strategy', function () {
  testRunner('vamsUSD', ['Morpho_MetronomeMsUSD_Vault_msUSD'], [{ debtRatio: 10000 }])
})
