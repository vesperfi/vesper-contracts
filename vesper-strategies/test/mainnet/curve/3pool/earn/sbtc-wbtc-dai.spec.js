'use strict'

const testRunner = require('../../../../utils/testRunner')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require(`vesper-commons/config/${getChain()}/address`)

describe('sbtc-wbtc VEWBTC_DAI Pool', function () {
  testRunner('VEWBTC_DAI', ['Curve_Earn_sbtc_WBTC_DAI'], [{ debtRatio: 10000 }], {
    growPool: { address: Address.Vesper.vaDAI },
  })
})
