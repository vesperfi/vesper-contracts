'use strict'

const Address = require('./address')
const StrategyTypes = require('../../test/utils/strategyTypes')

const swapper = Address.Vesper.Swapper
const config = { debtRatio: 0, externalDepositFee: 0 }

const setup = {
  feeCollector: Address.Vesper.FEE_COLLECTOR,
  keepers: [Address.Vesper.KEEPER, Address.Vesper.MP, Address.Vesper.JCV],
}
// Maker related strategies will have to add more setup config.
// For example const maker = { gemJoin: Address.MCD_JOIN_ETH_A, highWater: 275, lowWater: 250 }

/* eslint-disable camelcase */
const StrategyConfig = {
  VesperCompoundXYStrategyETH_LINK: {
    contract: 'VesperCompoundXYStrategyETH',
    type: StrategyTypes.VESPER_COMPOUND_XY,
    constructorArgs: {
      pool: Address.Vesper.vaETH,
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      borrowCToken: Address.Compound.cLINK,
      vPool: Address.Vesper.vaLINK,
      vsp: Address.Vesper.VSP,
      strategyName: 'VesperCompoundXYStrategyETH_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
