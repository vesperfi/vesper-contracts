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
  Alpaca_BNB: {
    contract: 'AlpacaBNB',
    type: StrategyTypes.ALPACA,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpaca.ibBNB,
      rewardToken: Address.Alpaca.ALPACA,
      poolId: '1',
      strategyName: 'Alpaca_BNB',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Alpaca_BUSD: {
    contract: 'Alpaca',
    type: StrategyTypes.ALPACA,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpaca.ibBUSD,
      rewardToken: Address.Alpaca.ALPACA,
      poolId: '3',
      strategyName: 'Alpaca_BUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Stargate_BUSD: {
    contract: 'Stargate',
    type: StrategyTypes.STARGATE,
    constructorArgs: {
      swapper,
      stargateRouter: Address.Stargate.router,
      stargateLp: Address.Stargate.busdLP,
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: 5, // BUSD LP Pool ID
      stargateLpStakingPoolId: 1, // Staking Contract pool ID
      strategyName: 'Stargate_BUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },
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

  Venus_Vesper_Xy_BNB_BUSD: {
    contract: 'VenusVesperXyBNB',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Venus.Unitroller,
      rewardToken: Address.Venus.XVS,
      receiptToken: Address.Venus.vBNB,
      borrowCToken: Address.Venus.vBUSD,
      vPool: Address.Vesper.vaBUSD,
      strategyName: 'Venus_Vesper_Xy_BNB_BUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Venus_Vesper_Xy_BUSD_BNB: {
    contract: 'VenusVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Venus.Unitroller,
      rewardToken: Address.Venus.XVS,
      receiptToken: Address.Venus.vBUSD,
      borrowCToken: Address.Venus.vBNB,
      vPool: Address.Vesper.vaBNB,
      strategyName: 'Venus_Vesper_Xy_BUSD_BNB',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
