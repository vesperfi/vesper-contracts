'use strict'

const testRunner = require('../../../utils/testRunner')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require(`vesper-commons/config/${getChain()}/address`)

describe('VEDAI_WBTC Pool with Vesper Earn strategy', function () {
  testRunner('VEDAI_WBTC', ['Vesper_Earn_DAI_WBTC'], [{ debtRatio: 9500 }], {
    rewardTokens: [Address.WBTC],
  })
})
