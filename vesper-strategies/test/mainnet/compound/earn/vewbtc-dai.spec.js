'use strict'

const testRunner = require('../../../utils/testRunner')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require(`vesper-commons/config/${getChain()}/address`)

describe('VEWBTC_DAI Pool', function () {
  testRunner('VEWBTC_DAI', ['Compound_Earn_WBTC_DAI'], [{ debtRatio: 9500 }], {
    growPool: { address: Address.Vesper.vaDAI },
  })
})
