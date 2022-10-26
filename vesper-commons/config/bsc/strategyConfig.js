'use strict'

const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')

const swapper = Address.Vesper.Swapper
const config = { debtRatio: 0, externalDepositFee: 0 }

const setup = {
  feeCollector: Address.Vesper.FEE_COLLECTOR,
  keepers: [Address.Vesper.KEEPER],
}

/* eslint-disable camelcase */
const StrategyConfig = {
  Venus_BUSD: {
    contract: 'Venus',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Venus.Unitroller,
      rewardToken: Address.Venus.XVS,
      receiptToken: Address.Venus.vBUSD,
      strategyName: 'Venus_BUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Venus_BNB: {
    contract: 'VenusBNB',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Venus.Unitroller,
      rewardToken: Address.Venus.XVS,
      receiptToken: Address.Venus.vBNB,
      strategyName: 'Venus_BNB',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
