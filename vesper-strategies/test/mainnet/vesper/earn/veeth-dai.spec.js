'use strict'

const testRunner = require('../../../utils/testRunner')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require(`vesper-commons/config/${getChain()}/address`)

describe('VEETH_DAI Pool with Vesper Earn strategy', function () {
  testRunner('VEETH_DAI', ['Vesper_Earn_ETH_DAI'], [{ debtRatio: 9500 }], {
    growPool: { address: Address.Vesper.vaDAI },
  })
})
