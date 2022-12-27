'use strict'

const { ethers } = require('hardhat')
const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')
const { EllipsisPoolTypes } = require('../../utils/curvePoolTypes')

const masterOracle = Address.Vesper.MasterOracle

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
  DotDot_Val3Pool_BUSD: {
    contract: 'DotDot',
    type: StrategyTypes.DOT_DOT,
    constructorArgs: {
      ellipsisPool: Address.Ellipsis.VAL_3EPS,
      ellipsisPoolType: EllipsisPoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      ellipsisSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'DotDot_Val3Pool_BUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Ellipsis_Val3Pool_BUSD: {
    contract: 'Ellipsis',
    type: StrategyTypes.ELLIPSIS,
    constructorArgs: {
      ellipsisPool: Address.Ellipsis.VAL_3EPS,
      ellipsisPoolType: EllipsisPoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      ellipsisSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Ellipsis_Val3Pool_BUSD',
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

  Wombat_BUSD: {
    contract: 'Wombat',
    type: StrategyTypes.WOMBAT,
    constructorArgs: {
      swapper,
      wombatPool: Address.Wombat.MainPool,
      strategyName: 'Wombat_BUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
