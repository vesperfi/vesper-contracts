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

  AaveV3_Vesper_Xy_wstETH_ETH: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.AaveV3.aBaswstETH,
      borrowToken: Address.WETH,
      aaveAddressProvider: Address.AaveV3.AddressProvider,
      vPool: Address.Vesper.vaETH,
      strategyName: 'AaveV3_Vesper_Xy_wstETH_ETH',
    },
    config,
    setup,
  },

  AaveV3_Vesper_Xy_wstETH_USDC: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.AaveV3.aBaswstETH,
      borrowToken: Address.USDC,
      aaveAddressProvider: Address.AaveV3.AddressProvider,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'AaveV3_Vesper_Xy_wstETH_USDC',
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

  CompoundV3_Vesper_Xy_cbETH_ETH: {
    contract: 'CompoundV3VesperXy',
    type: StrategyTypes.COMPOUNDV3_VESPER_XY,
    constructorArgs: {
      swapper,
      compRewards: Address.CompoundV3.Rewards,
      rewardToken: Address.CompoundV3.COMP,
      comet: Address.CompoundV3.cWETHv3,
      borrowToken: Address.WETH,
      vPool: Address.Vesper.vaETH,
      strategyName: 'CompoundV3_Vesper_Xy_cbETH_ETH',
    },
    config,
    setup,
  },

  CompoundV3_Vesper_Xy_cbETH_USDC: {
    contract: 'CompoundV3VesperXy',
    type: StrategyTypes.COMPOUNDV3_VESPER_XY,
    constructorArgs: {
      swapper,
      compRewards: Address.CompoundV3.Rewards,
      rewardToken: Address.CompoundV3.COMP,
      comet: Address.CompoundV3.cUSDCv3,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'CompoundV3_Vesper_Xy_cbETH_USDC',
    },
    config,
    setup,
  },

  ExtraFinance_ETH_1: {
    contract: 'ExtraFinance',
    type: StrategyTypes.EXTRA_FINANCE,
    constructorArgs: {
      swapper,
      lendingPool: Address.ExtraFinance.LendingPool,
      reserveId: 1,
      strategyName: 'ExtraFinance_ETH_1',
    },
    config,
    setup,
  },

  ExtraFinance_ETH_LRT: {
    contract: 'ExtraFinance',
    type: StrategyTypes.EXTRA_FINANCE,
    constructorArgs: {
      swapper,
      lendingPool: Address.ExtraFinance.LendingPool,
      reserveId: 49,
      strategyName: 'ExtraFinance_ETH_LRT',
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

  Stargate_ETH: {
    contract: 'StargateTimeETH',
    type: StrategyTypes.STARGATE,
    constructorArgs: {
      swapper,
      stargateRouter: Address.Stargate.router,
      stargateLp: Address.Stargate.ethLP,
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: 13, // ETH LP Pool ID, https://stargateprotocol.gitbook.io/stargate/developers/pool-ids
      stargateLpStakingPoolId: 0, // https://basescan.org/address/0x06Eb48763f117c7Be887296CDcdfad2E4092739C
      wrappedNativeToken: Address.WRAPPED_NATIVE_TOKEN,
      strategyName: 'Stargate_ETH',
    },
    config,
    setup,
  },
}

module.exports = Object.freeze(StrategyConfig)
