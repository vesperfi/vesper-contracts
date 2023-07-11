'use strict'

const testRunner = require('../../../../utils/testRunner')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require(`vesper-commons/config/${getChain()}/address`)

// Curve Earn strategy size is above 24kb and not deployable
describe.skip('sbtc-wbtc VEWBTC_DAI Pool', function () {
  testRunner('VEWBTC_DAI', ['Curve_Earn_sbtc_WBTC_DAI'], [{ debtRatio: 10000 }], {
    growPool: { address: Address.Vesper.vaDAI },
  })
})
