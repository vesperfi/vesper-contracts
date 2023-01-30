'use strict'

const testRunner = require('../../../utils/testRunner')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require(`vesper-commons/config/${getChain()}/address`)

describe('VEFRAX_FRAXBP Pool', function () {
  testRunner('VEFRAX_FRAXBP', ['Vesper_Earn_FRAX_FRAXBP'], [{ debtRatio: 9000 }], {
    rewardTokens: [Address.Saddle.FRAXBP_LP],
  })
})
