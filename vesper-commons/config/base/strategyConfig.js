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
  AaveV3_USDC: {
    contract: 'AaveV3',
    type: StrategyTypes.AAVE_V3,
    constructorArgs: {
      swapper,
      receiptToken: Address.AaveV3.aBasUSDC,
      aaveAddressProvider: Address.AaveV3.AddressProvider,
      strategyName: 'AaveV3_USDC',
    },
    config,
    setup,
  },
  CompoundV3_USDC: {
    contract: 'CompoundV3',
    type: StrategyTypes.COMPOUNDV3,
    constructorArgs: {
      swapper,
      compRewards: Address.CompoundV3.Rewards,
      rewardToken: Address.CompoundV3.COMP,
      comet: Address.CompoundV3.cUSDCv3,
      strategyName: 'CompoundV3_USDC',
    },
    config,
    setup,
  },

  ExtraFinance_USDC_1: {
    contract: 'ExtraFinance',
    type: StrategyTypes.EXTRA_FINANCE,
    constructorArgs: {
      swapper,
      lendingPool: Address.ExtraFinance.LendingPool,
      reserveId: 24,
      strategyName: 'ExtraFinance_USDC_1',
    },
    config,
    setup,
  },

  ExtraFinance_USDC_2: {
    contract: 'ExtraFinance',
    type: StrategyTypes.EXTRA_FINANCE,
    constructorArgs: {
      swapper,
      lendingPool: Address.ExtraFinance.LendingPool,
      reserveId: 25,
      strategyName: 'ExtraFinance_USDC_2',
    },
    config,
    setup,
  },
}

module.exports = Object.freeze(StrategyConfig)
