'use strict'

const { ethers } = require('hardhat')
const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')
const CurvePoolTypes = require('../../utils/curvePoolTypes')

const masterOracle = Address.Vesper.MasterOracle
const swapper = Address.Vesper.Swapper
const config = { debtRatio: 0, externalDepositFee: 0 }
const setup = {
  feeCollector: Address.Vesper.FEE_COLLECTOR,
  keepers: [Address.Vesper.KEEPER, Address.Vesper.MP, Address.Vesper.JCV],
}

// TODO update setup to remove strategy type, once done remove type from heres too
/* eslint-disable camelcase */
const StrategyConfig = {
  AaveV3DAIe: {
    contract: 'AaveV3',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aAvaDAI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      strategyName: 'AaveV3-DAIe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  AaveV3_Vesper_Xy_ETH_DAIe: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aAvaWETH,
      borrowToken: Address.DAIe,
      aaveAddressProvider: Address.Aave.AddressProvider,
      vPool: Address.Vesper.vaDAIe,
      vsp: Address.Vesper.VSP,
      strategyName: 'AaveV3_Vesper_Xy_ETH_DAIe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Curve_aave_DAIe: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.AAVE_POOL,
      curvePoolType: CurvePoolTypes.LENDING_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1.0%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_aave_DAIe',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_aave_USDCe: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.AAVE_POOL,
      curvePoolType: CurvePoolTypes.LENDING_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1.0%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_aave_USDCe',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_ren_WBTCe: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.AVWBTCRENBTC_POOL,
      curvePoolType: CurvePoolTypes.LENDING_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 200, // 2.0%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_ren_WBTCe',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  TraderJoe_USDCe: {
    contract: 'CompoundLike',
    type: StrategyTypes.TRADER_JOE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardDistributor: Address.TraderJoe.REWARD_DISTRIBUTOR,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jUSDC,
      strategyName: 'TraderJoe_USDCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_USDC: {
    contract: 'CompoundLike',
    type: StrategyTypes.TRADER_JOE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardDistributor: Address.TraderJoe.REWARD_DISTRIBUTOR,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jUSDCNative,
      strategyName: 'TraderJoe_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_AVAX: {
    contract: 'CompoundLike',
    type: StrategyTypes.TRADER_JOE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardDistributor: Address.TraderJoe.REWARD_DISTRIBUTOR,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jAVAX,
      strategyName: 'TraderJoe_AVAX',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_WETHe: {
    contract: 'CompoundLike',
    type: StrategyTypes.TRADER_JOE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardDistributor: Address.TraderJoe.REWARD_DISTRIBUTOR,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jWETH,
      strategyName: 'TraderJoe_WETHe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_DAIe: {
    contract: 'CompoundLike',
    type: StrategyTypes.TRADER_JOE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardDistributor: Address.TraderJoe.REWARD_DISTRIBUTOR,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jDAI,
      strategyName: 'TraderJoe_DAIe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_WBTCe: {
    contract: 'CompoundLike',
    type: StrategyTypes.TRADER_JOE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardDistributor: Address.TraderJoe.REWARD_DISTRIBUTOR,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jWBTC,
      strategyName: 'TraderJoe_WBTCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_USDCe: {
    contract: 'CompoundLike',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiUSDC,
      strategyName: 'Benqi_USDCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },
  Benqi_DAIe: {
    contract: 'CompoundLike',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiDAI,
      strategyName: 'Benqi_DAIe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },
  Benqi_WETHe: {
    contract: 'CompoundLike',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiETH,
      strategyName: 'Benqi_WETHe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_WBTCe: {
    contract: 'CompoundLike',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiBTC,
      strategyName: 'Benqi_WBTCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_USDC: {
    contract: 'CompoundLike',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiUSDCn,
      strategyName: 'Benqi_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_AVAX: {
    contract: 'BenqiAVAX',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiAVAX,
      strategyName: 'Benqi_AVAX',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_QI: {
    contract: 'CompoundLike',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardDistributor: Address.Benqi.REWARD_DISTRIBUTOR,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiQI,
      strategyName: 'Benqi_QI',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_Leverage_USDC: {
    contract: 'CompoundLikeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Benqi.qiUSDCn,
      strategyName: 'Benqi_Leverage_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_Leverage_USDCe: {
    contract: 'CompoundLikeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Benqi.qiUSDC,
      strategyName: 'Benqi_Leverage_USDCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_Leverage_DAIe: {
    contract: 'CompoundLikeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Benqi.qiDAI,
      strategyName: 'Benqi_Leverage_DAIe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_Leverage_AVAX: {
    contract: 'BenqiLeverageAVAX',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Benqi.qiAVAX,
      strategyName: 'Benqi_Leverage_AVAX',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_Leverage_WBTCe: {
    contract: 'CompoundLikeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Benqi.qiBTC,
      strategyName: 'Benqi_Leverage_WBTCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Benqi_Leverage_WETHe: {
    contract: 'CompoundLikeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Benqi.qiETH,
      strategyName: 'Benqi_Leverage_WETHe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_Leverage_WETHe: {
    contract: 'TraderJoeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.TraderJoe.jWETH,
      strategyName: 'TraderJoe_Leverage_WETHe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_Leverage_AVAX: {
    contract: 'TraderJoeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.TraderJoe.jAVAX,
      strategyName: 'TraderJoe_Leverage_AVAX',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_Leverage_DAIe: {
    contract: 'TraderJoeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.TraderJoe.jDAI,
      strategyName: 'TraderJoe_Leverage_DAIe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_Leverage_USDCe: {
    contract: 'TraderJoeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.TraderJoe.jUSDC,
      strategyName: 'TraderJoe_Leverage_USDCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_Leverage_USDC: {
    contract: 'TraderJoeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.TraderJoe.jUSDCNative,
      strategyName: 'TraderJoe_Leverage_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  TraderJoe_Leverage_WBTCe: {
    contract: 'TraderJoeLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.TraderJoe.jWBTC,
      strategyName: 'TraderJoe_Leverage_WBTCe',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  AlphaLendStrategyDAIe: {
    contract: 'AlphaLendAvalancheStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibDAIev2,
      strategyName: 'AlphaLendStrategyDAIe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyWETHe: {
    contract: 'AlphaLendAvalancheStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibWETHev2,
      strategyName: 'AlphaLendStrategyWETHe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyUSDCe: {
    contract: 'AlphaLendAvalancheStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibUSDCev2,
      strategyName: 'AlphaLendStrategyUSDCe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyUSDC: {
    contract: 'AlphaLendAvalancheStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibUSDCv2,
      strategyName: 'AlphaLendStrategyUSDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyWBTCe: {
    contract: 'AlphaLendAvalancheStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibWBTCev2,
      strategyName: 'AlphaLendStrategyWBTCe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyAVAX: {
    contract: 'AlphaLendAvalancheStrategyAVAX',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibAVAXv2,
      strategyName: 'AlphaLendStrategyAVAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Benqi_Vesper_Xy_WBTCe_WETHe: {
    contract: 'BenqiVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Benqi.COMPTROLLER,
      rewardToken: Address.Benqi.QI,
      receiptToken: Address.Benqi.qiBTC,
      borrowCToken: Address.Benqi.qiETH,
      vPool: Address.Vesper.vaWETHe,
      vsp: Address.Vesper.VSP,
      strategyName: 'Benqi_Vesper_Xy_WBTCe_WETHe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  TraderJoe_Vesper_Xy_AVAX_WETHe: {
    contract: 'TraderJoeVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jAVAX,
      borrowCToken: Address.TraderJoe.jWETH,
      vPool: Address.Vesper.vaWETHe,
      vsp: Address.Vesper.VSP,
      strategyName: 'TraderJoe_Vesper_Xy_AVAX_WETHe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  TraderJoe_Vesper_Xy_WBTCe_WETHe: {
    contract: 'TraderJoeVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jWBTC,
      borrowCToken: Address.TraderJoe.jWETH,
      vPool: Address.Vesper.vaWETHe,
      vsp: Address.Vesper.VSP,
      strategyName: 'TraderJoe_Vesper_Xy_WBTCe_WETHe',
    },
    config: { ...config },
    setup: { ...setup },
  },

  TraderJoe_Vesper_Xy_WBTCe_USDCe: {
    contract: 'TraderJoeVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.TraderJoe.COMPTROLLER,
      rewardToken: Address.TraderJoe.JOE,
      receiptToken: Address.TraderJoe.jWBTC,
      borrowCToken: Address.TraderJoe.jUSDC,
      vPool: Address.Vesper.vaUSDCe,
      vsp: Address.Vesper.VSP,
      strategyName: 'TraderJoe_Vesper_Xy_WBTCe_USDCe',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
