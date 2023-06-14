'use strict'

const { ethers } = require('hardhat')
const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')
const { CurvePoolTypes } = require('../../utils/curvePoolTypes')

const masterOracle = Address.Vesper.MasterOracle
const swapper = Address.Vesper.Swapper
const config = { debtRatio: 0, externalDepositFee: 0 }

const setup = {
  feeCollector: Address.Vesper.FEE_COLLECTOR,
  keepers: [Address.Vesper.KEEPER, Address.Vesper.MP, Address.Vesper.JCV],
}
// Maker related strategies will have to add more setup config.
// For example const maker = { gemJoin: Address.MCD_JOIN_ETH_A, highWater: 275, lowWater: 250 }

// TODO update setup to remove strategy type, once done remove type from heres too
/* eslint-disable camelcase */
const StrategyConfig = {
  Aave_V2_DAI: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aDAI,
      strategyName: 'Aave_V2_DAI',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  Aave_V2_DPI: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aDPI,
      strategyName: 'Aave_V2_DPI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_ETH: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aWETH,
      strategyName: 'Aave_V2_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_FEI: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aFEI,
      strategyName: 'Aave_V2_FEI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_LINK: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aLINK,
      strategyName: 'Aave_V2_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_UNI: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aUNI,
      strategyName: 'Aave_V2_UNI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_USDC: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aUSDC,
      strategyName: 'Aave_V2_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_USDT: {
    contract: 'AaveV2',
    type: StrategyTypes.AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aUSDT,
      strategyName: 'Aave_V2_USDT',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_V2_Leverage_DAI: {
    contract: 'AaveV2Leverage',
    type: StrategyTypes.AAVE_LEVERAGE,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Aave.aDAI,
      strategyName: 'Aave_V2_Leverage_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV2_Vesper_Xy_ETH_DAI: {
    contract: 'AaveV2VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      receiptToken: Address.Aave.aWETH,
      borrowToken: Address.DAI,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'AaveV2_Vesper_Xy_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV2_Vesper_Xy_ETH_FEI: {
    contract: 'AaveV2VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      receiptToken: Address.Aave.aWETH,
      borrowToken: Address.FEI,
      vPool: Address.Vesper.vaFEI,
      strategyName: 'AaveV2_Vesper_Xy_ETH_FEI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV2_Vesper_Xy_LINK_USDC: {
    contract: 'AaveV2VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      receiptToken: Address.Aave.aLINK,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'AaveV2_Vesper_Xy_LINK_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV2_Vesper_Xy_stETH_DAI: {
    contract: 'AaveV2VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      receiptToken: Address.Aave.aSTETH,
      borrowToken: Address.DAI,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'AaveV2_Vesper_Xy_stETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV2_Vesper_Xy_WBTC_FEI: {
    contract: 'AaveV2VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      receiptToken: Address.Aave.aWBTC,
      borrowToken: Address.FEI,
      vPool: Address.Vesper.vaFEI,
      strategyName: 'AaveV2_Vesper_Xy_WBTC_FEI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV2_Vesper_Xy_WBTC_FRAX: {
    contract: 'AaveV2VesperXy',
    type: StrategyTypes.AAVE_VESPER_XY,
    constructorArgs: {
      swapper,
      rewardToken: Address.Aave.AAVE,
      receiptToken: Address.Aave.aWBTC,
      borrowToken: Address.FRAX,
      vPool: Address.Vesper.vaFRAX,
      strategyName: 'AaveV2_Vesper_Xy_WBTC_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveV3_Vesper_Xy_ETH_DAI: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.V3.aWETH,
      borrowToken: Address.DAI,
      aaveAddressProvider: Address.Aave.V3.AddressProvider,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'AaveV3_Vesper_Xy_ETH_DAI',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  AaveV3_Vesper_Xy_CBETH_DAI: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.V3.acbETH,
      borrowToken: Address.DAI,
      aaveAddressProvider: Address.Aave.V3.AddressProvider,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'AaveV3_Vesper_Xy_CBETH_DAI',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },

  // Aave V1 strategy
  AaveV1StrategyUSDC: {
    contract: 'AaveV1Strategy',
    type: StrategyTypes.AAVE_V1,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aUSDCv1,
      strategyName: 'AaveV1StrategyUSDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Aave_Earn_ETH_DAI: {
    contract: 'AaveEarn',
    type: StrategyTypes.EARN_AAVE,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aWETH,
      dripToken: Address.DAI,
      strategyName: 'Aave_Earn_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_DAI: {
    contract: 'Compound',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cDAI,
      strategyName: 'Compound_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_LINK: {
    contract: 'Compound',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cLINK,
      strategyName: 'Compound_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_ETH: {
    contract: 'CompoundETH',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      strategyName: 'Compound_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_UNI: {
    contract: 'Compound',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cUNI,
      strategyName: 'Compound_UNI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_USDC: {
    contract: 'Compound',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cUSDC,
      strategyName: 'Compound_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_USDT: {
    contract: 'Compound',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cUSDT,
      strategyName: 'Compound_USDT',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_WBTC: {
    contract: 'Compound',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cWBTC,
      strategyName: 'Compound_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Inverse_Compound_ETH: {
    contract: 'CompoundETH',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Inverse.COMPTROLLER,
      rewardToken: Address.Inverse.INV,
      receiptToken: Address.Inverse.anETH,
      strategyName: 'Inverse_Compound_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Inverse_Leverage_ETH: {
    contract: 'CompoundLeverageETH',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Inverse.COMPTROLLER,
      rewardDistributor: Address.Inverse.COMPTROLLER,
      rewardToken: Address.Inverse.INV,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Inverse.anETH,
      strategyName: 'Inverse_Leverage_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Drops_Compound_ETH: {
    contract: 'CompoundETH',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Drops.COMPTROLLER,
      rewardToken: Address.Drops.DOP,
      receiptToken: Address.Drops.dETH,
      strategyName: 'Drops_Compound_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Earn_ETH_DAI: {
    contract: 'CompoundEarnETH',
    type: StrategyTypes.EARN_COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      dripToken: Address.DAI,
      strategyName: 'Compound_Earn_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Earn_WBTC_DAI: {
    contract: 'CompoundEarn',
    type: StrategyTypes.EARN_COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cWBTC,
      dripToken: Address.DAI,
      strategyName: 'Compound_Earn_WBTC_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Leverage_ETH: {
    contract: 'CompoundLeverageETH',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Compound.cETH,
      strategyName: 'Compound_Leverage_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Leverage_DAI: {
    contract: 'CompoundLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Compound.cDAI,
      strategyName: 'Compound_Leverage_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Leverage_UNI: {
    contract: 'CompoundLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Compound.cUNI,
      strategyName: 'Compound_Leverage_UNI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Leverage_LINK: {
    contract: 'CompoundLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Compound.cLINK,
      strategyName: 'Compound_Leverage_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Leverage_WBTC: {
    contract: 'CompoundLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Compound.cWBTC,
      strategyName: 'Compound_Leverage_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Xy_ETH_DAI: {
    contract: 'CompoundXyETH',
    type: StrategyTypes.COMPOUND_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      borrowCToken: Address.Compound.cDAI,
      strategyName: 'Compound_Xy_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Xy_WBTC_DAI: {
    contract: 'CompoundXy',
    type: StrategyTypes.COMPOUND_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cWBTC,
      borrowCToken: Address.Compound.cDAI,
      strategyName: 'Compound_Xy_WBTC_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_ETH_WBTC: {
    contract: 'CompoundVesperXyETH',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      borrowCToken: Address.Compound.cWBTC,
      vPool: Address.Vesper.vaWBTC,
      strategyName: 'Compound_Vesper_Xy_ETH_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_ETH_DAI: {
    contract: 'CompoundVesperXyETH',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      borrowCToken: Address.Compound.cDAI,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'Compound_Vesper_Xy_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_ETH_LINK: {
    contract: 'CompoundVesperXyETH',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cETH,
      borrowCToken: Address.Compound.cLINK,
      vPool: Address.Vesper.vaLINK,
      strategyName: 'Compound_Vesper_Xy_ETH_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_WBTC_DAI: {
    contract: 'CompoundVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cWBTC,
      borrowCToken: Address.Compound.cDAI,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'Compound_Vesper_Xy_WBTC_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_WBTC_USDC: {
    contract: 'CompoundVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cWBTC,
      borrowCToken: Address.Compound.cUSDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'Compound_Vesper_Xy_WBTC_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_WBTC_LINK: {
    contract: 'CompoundVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cWBTC,
      borrowCToken: Address.Compound.cLINK,
      vPool: Address.Vesper.vaLINK,
      strategyName: 'Compound_Vesper_Xy_WBTC_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Compound_Vesper_Xy_DAI_USDC: {
    contract: 'CompoundVesperXy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.Compound.COMPTROLLER,
      rewardToken: Address.Compound.COMP,
      receiptToken: Address.Compound.cDAI,
      borrowCToken: Address.Compound.cUSDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'Compound_Vesper_Xy_DAI_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_ren_WBTC: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.REN_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 300, // 3.0%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 6,
      strategyName: 'Convex_ren_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_fraxusdc_FRAX: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_USDC_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 100,
      strategyName: 'Convex_fraxusdc_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_3pool_DAI: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.THREE_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 20, // 0.2%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 9,
      strategyName: 'Convex_3pool_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_sbtc_WBTC: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.SBTC_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 2500, // 25%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 7,
      strategyName: 'Convex_sbtc_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_d3pool_FRAX: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.D3_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      // The d3pool is unbalanced at the moment (block 15688590)
      crvSlippage: 1500, // 15%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 58,
      strategyName: 'Convex_d3pool_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_d3pool_FEI: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.D3_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      // The d3pool is unbalanced at the moment (block 15688590)
      crvSlippage: 1500, // 15%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 58,
      strategyName: 'Convex_d3pool_FEI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_d3pool_AlUSD: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.D3_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 250, // 2.5%
      masterOracle,
      swapper,
      collateralIdx: 2,
      convexPoolId: 58,
      strategyName: 'Convex_d3pool_AlUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_mim_MIM: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.MIM_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 40,
      strategyName: 'Convex_mim_MIM',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_musd_MUSD: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.MUSD_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.MUSD_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 14,
      strategyName: 'Convex_musd_MUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_frax_FRAX: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 32,
      strategyName: 'Convex_frax_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_dola_DAI: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.DOLA_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 62,
      strategyName: 'Convex_dola_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_frax_DAI: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 32,
      strategyName: 'Convex_frax_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_frax_USDC: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 2,
      convexPoolId: 32,
      strategyName: 'Convex_frax_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_ibBTC_WBTC: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.IBBTC_SBTC_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.SBTC_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 2500, // 25%
      masterOracle,
      swapper,
      collateralIdx: 2,
      convexPoolId: 53,
      strategyName: 'Convex_ibBTC_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  ConvexForFrax_fraxusdc_FRAX: {
    contract: 'ConvexForFrax',
    type: StrategyTypes.CONVEX_FOR_FRAX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_USDC_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      convexPoolId: 9,
      strategyName: 'ConvexForFrax_fraxusdc_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  ConvexForFrax_fraxusdc_USDC: {
    contract: 'ConvexForFrax',
    type: StrategyTypes.CONVEX_FOR_FRAX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_USDC_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 9,
      strategyName: 'ConvexForFrax_fraxusdc_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  ConvexForFrax_dolafraxbp_FRAX: {
    contract: 'ConvexForFrax',
    type: StrategyTypes.CONVEX_FOR_FRAX,
    constructorArgs: {
      crvPool: Address.Curve.DOLA_CRVFRAX_POOL,
      curvePoolType: CurvePoolTypes.META_3_POOL,
      depositZap: Address.Curve.FACTORY_METAPOOLS_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 27,
      strategyName: 'ConvexForFrax_dolafraxbp_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  ConvexForFrax_dolafraxbp_USDC: {
    contract: 'ConvexForFrax',
    type: StrategyTypes.CONVEX_FOR_FRAX,
    constructorArgs: {
      crvPool: Address.Curve.DOLA_CRVFRAX_POOL,
      curvePoolType: CurvePoolTypes.META_3_POOL,
      depositZap: Address.Curve.FACTORY_METAPOOLS_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 2,
      convexPoolId: 27,
      strategyName: 'ConvexForFrax_dolafraxbp_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_dolafraxbp_USDC: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.DOLA_CRVFRAX_POOL,
      curvePoolType: CurvePoolTypes.META_3_POOL,
      depositZap: Address.Curve.FACTORY_METAPOOLS_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 2,
      convexPoolId: 115,
      strategyName: 'Convex_dolafraxbp_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_dolafraxbp_FRAX: {
    contract: 'Convex',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.DOLA_CRVFRAX_POOL,
      curvePoolType: CurvePoolTypes.META_3_POOL,
      depositZap: Address.Curve.FACTORY_METAPOOLS_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 1,
      convexPoolId: 115,
      strategyName: 'Convex_dolafraxbp_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_ren_WBTC: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.REN_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 500, // 5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_ren_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_3pool_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.THREE_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 30, // 0.3%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_3pool_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_3pool_USDC: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.THREE_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_3pool_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_sbtc_WBTC: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SBTC_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 2500, // 25%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_sbtc_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_Earn_sbtc_WBTC_DAI: {
    contract: 'CurveEarn',
    type: StrategyTypes.EARN_CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SBTC_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 2500, // 25%
      masterOracle,
      swapper,
      collateralIdx: 1,
      dripToken: Address.DAI,
      strategyName: 'Curve_Earn_sbtc_WBTC_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_mim_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.MIM_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_mim_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_mim_MIM: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.MIM_3CRV_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_mim_MIM',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_GUSD_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.GUSD_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_4_POOL,
      depositZap: Address.Curve.GUSD_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_GUSD_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_sUSD_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SUSD_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_4_POOL,
      depositZap: Address.Curve.SUSD_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_sUSD_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_aave_DAI: {
    contract: 'CurveAaveLendingPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      curvePoolType: CurvePoolTypes.LENDING_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_aave_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_aave_USDC: {
    contract: 'CurveAaveLendingPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      curvePoolType: CurvePoolTypes.LENDING_3_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 20, // 0.2%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_aave_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_compound_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.COMPOUND_POOL,
      curvePoolType: CurvePoolTypes.LENDING_2_POOL,
      crvDeposit: Address.Curve.COMPOUND_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 200, // 2.0%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_compound_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_usdt_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.USDT_POOL,
      curvePoolType: CurvePoolTypes.LENDING_3_POOL,
      crvDeposit: Address.Curve.USDT_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_usdt_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_busd_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.BUSD_POOL,
      curvePoolType: CurvePoolTypes.LENDING_4_POOL,
      crvDeposit: Address.Curve.BUSD_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_busd_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_pax_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.PAX_POOL,
      curvePoolType: CurvePoolTypes.LENDING_4_POOL,
      crvDeposit: Address.Curve.PAX_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_pax_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_y_DAI: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.Y_POOL,
      curvePoolType: CurvePoolTypes.LENDING_4_POOL,
      crvDeposit: Address.Curve.Y_DEPOSIT,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_y_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_msUSD_USDC: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.MSUSD_POOL,
      curvePoolType: CurvePoolTypes.META_3_POOL,
      crvDeposit: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 2,
      strategyName: 'Curve_msUSD_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AaveMakerStrategyETH: {
    contract: 'AaveMakerStrategy',
    type: StrategyTypes.AAVE_MAKER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aDAI,
      collateralType: ethers.utils.formatBytes32String('ETH-A'),
      strategyName: 'AaveMakerStrategyETH',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_ETH_A, highWater: 275, lowWater: 250 } },
  },

  CompoundMakerStrategyETH: {
    contract: 'CompoundMakerStrategy',
    type: StrategyTypes.COMPOUND_MAKER,
    constructorArgs: {
      cm: Address.Vesper.COLLATERAL_MANAGER,
      swapper,
      receiptToken: Address.Compound.cDAI,
      collateralType: ethers.utils.formatBytes32String('ETH-C'),
      strategyName: 'CompoundMakerStrategyETH',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_ETH_C, highWater: 250, lowWater: 225 } },
  },

  Maker_Vesper_ETH: {
    contract: 'MakerVesper',
    type: StrategyTypes.VESPER_MAKER,
    constructorArgs: {
      cm: Address.Vesper.COLLATERAL_MANAGER,
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('ETH-C'),
      highWater: 250,
      lowWater: 225,
      strategyName: 'Maker_Vesper_ETH',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_ETH_C, highWater: 250, lowWater: 225 } },
  },

  Maker_Vesper_STETH: {
    contract: 'MakerVesperStETH',
    type: StrategyTypes.VESPER_MAKER,
    constructorArgs: {
      cm: Address.Vesper.COLLATERAL_MANAGER,
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('WSTETH-B'),
      highWater: 250,
      lowWater: 225,
      strategyName: 'Maker_Vesper_STETH',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_WSTETH_B } },
  },

  Maker_Vesper_RETH: {
    contract: 'MakerVesper',
    type: StrategyTypes.VESPER_MAKER,
    constructorArgs: {
      cm: Address.Vesper.COLLATERAL_MANAGER,
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('RETH-A'),
      highWater: 250,
      lowWater: 225,
      strategyName: 'Maker_Vesper_RETH',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_RETH_A } },
  },

  Maker_Vesper_LINK: {
    contract: 'MakerVesper',
    type: StrategyTypes.VESPER_MAKER,
    constructorArgs: {
      cm: Address.Vesper.COLLATERAL_MANAGER,
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('LINK-A'),
      highWater: 250,
      lowWater: 225,
      strategyName: 'Maker_Vesper_LINK',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_LINK_A, highWater: 250, lowWater: 225 } },
  },

  Maker_Vesper_WBTC: {
    contract: 'MakerVesper',
    type: StrategyTypes.VESPER_MAKER,
    constructorArgs: {
      cm: Address.Vesper.COLLATERAL_MANAGER,
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('WBTC-C'),
      highWater: 250,
      lowWater: 225,
      strategyName: 'Maker_Vesper_WBTC',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_WBTC_C, highWater: 250, lowWater: 225 } },
  },

  EarnAaveMakerStrategyETH_DAI: {
    contract: 'EarnAaveMakerStrategy',
    type: StrategyTypes.EARN_MAKER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aDAI,
      collateralType: ethers.utils.formatBytes32String('ETH-C'),
      dripToken: Address.DAI,
      strategyName: 'EarnAaveMakerStrategyETH_DAI',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_ETH_C, highWater: 250, lowWater: 225 } },
  },

  EarnCompoundMakerStrategyETH_DAI: {
    contract: 'EarnCompoundMakerStrategy',
    type: StrategyTypes.EARN_MAKER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Compound.cDAI,
      collateralType: ethers.utils.formatBytes32String('ETH-C'),
      dripToken: Address.DAI,
      strategyName: 'EarnCompoundMakerStrategyETH_DAI',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_ETH_C, highWater: 250, lowWater: 225 } },
  },

  EarnVesperMakerStrategyETH_DAI: {
    contract: 'EarnVesperMakerStrategy',
    type: StrategyTypes.EARN_VESPER_MAKER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('ETH-C'),
      dripToken: Address.DAI,
      strategyName: 'EarnVesperMakerStrategyETH_DAI',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_ETH_C, highWater: 250, lowWater: 225 } },
  },

  EarnVesperMakerStrategyLINK_DAI: {
    contract: 'EarnVesperMakerStrategy',
    type: StrategyTypes.EARN_VESPER_MAKER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('LINK-A'),
      dripToken: Address.DAI,
      strategyName: 'EarnVesperMakerStrategyLINK_DAI',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_LINK_A, highWater: 275, lowWater: 250 } },
  },

  EarnVesperMakerStrategyWBTC_DAI: {
    contract: 'EarnVesperMakerStrategy',
    type: StrategyTypes.EARN_VESPER_MAKER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      collateralType: ethers.utils.formatBytes32String('WBTC-A'),
      dripToken: Address.DAI,
      strategyName: 'EarnVesperMakerStrategyWBTC_DAI',
    },
    config: { ...config },
    setup: { ...setup, maker: { gemJoin: Address.Maker.MCD_JOIN_WBTC_A, highWater: 250, lowWater: 225 } },
  },

  Vesper_Earn_DAI_DPI: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.DPI,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_DPI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_DAI_LINK: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.LINK,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_LINK_DAI: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaLINK,
      dripToken: Address.DAI,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_LINK_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_DAI_SHIB: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.SHIB,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_SHIB',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_DAI_PUNK: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.PUNK,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_PUNK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_USDC_LMR: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaUSDC,
      dripToken: Address.LMR,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_USDC_LMR',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_DAI_VSP: {
    contract: 'Vesper_Earn_VSPDrip',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.Vesper.VSP,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_VSP',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_DAI_WBTC: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.WBTC,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_DAI_WETH: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaDAI,
      dripToken: Address.WETH,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_DAI_WETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_ETH_DAI: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaETH,
      dripToken: Address.DAI,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_WBTC_DAI: {
    contract: 'VesperEarn',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      swapper,
      receiptToken: Address.Vesper.vaWBTC,
      dripToken: Address.DAI,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_WBTC_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  YearnStrategyDAI: {
    contract: 'YearnStrategy',
    type: StrategyTypes.YEARN,
    constructorArgs: {
      swapper,
      receiptToken: Address.Yearn.yvDAI,
      strategyName: 'YearnStrategyDAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  YearnStrategyUSDC: {
    contract: 'YearnStrategy',
    type: StrategyTypes.YEARN,
    constructorArgs: {
      swapper,
      receiptToken: Address.Yearn.yvUSDC,
      strategyName: 'YearnStrategyUSDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Stargate_USDC: {
    contract: 'Stargate',
    type: StrategyTypes.STARGATE,
    constructorArgs: {
      swapper,
      stargateRouter: Address.Stargate.router,
      stargateLp: Address.Stargate.usdcLP,
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: '1', // USDC LP Pool ID
      stargateLpStakingPoolId: '0', // Staking Contract pool ID
      strategyName: 'Stargate_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Stargate_ETH: {
    contract: 'StargateETH',
    type: StrategyTypes.STARGATE,
    constructorArgs: {
      swapper,
      stargateRouter: Address.Stargate.router,
      stargateLp: Address.Stargate.ethLP,
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: 13, // ETH LP Pool ID
      stargateLpStakingPoolId: 2, // Staking Contract pool ID
      wrappedNativeToken: Address.NATIVE_TOKEN,
      strategyName: 'Stargate_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Stargate_FRAX: {
    contract: 'Stargate',
    type: StrategyTypes.STARGATE,
    constructorArgs: {
      swapper,
      stargateRouter: Address.Stargate.router,
      stargateLp: Address.Stargate.fraxLP,
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: 7, // FRAX LP Pool ID
      stargateLpStakingPoolId: 4, // Staking Contract pool ID
      strategyName: 'Stargate_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Stargate_DAI: {
    contract: 'Stargate',
    type: StrategyTypes.STARGATE,
    constructorArgs: {
      swapper,
      stargateRouter: Address.Stargate.router,
      stargateLp: Address.Stargate.daiLP,
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: 3, // DAI LP Pool ID
      stargateLpStakingPoolId: 3, // Staking Contract pool ID
      strategyName: 'Stargate_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Vesper_Earn_FRAX_FRAXBP: {
    contract: 'VesperEarnSaddleLp',
    type: StrategyTypes.EARN_VESPER,
    constructorArgs: {
      saddlePool: Address.Saddle.FRAXBP_POOL,
      swapper,
      receiptToken: Address.Vesper.vaFRAX,
      dripToken: Address.Saddle.FRAXBP_LP,
      vsp: Address.Vesper.VSP,
      strategyName: 'Vesper_Earn_FRAX_FRAXBP',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Euler_ETH: {
    contract: 'Euler',
    type: StrategyTypes.EULER,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      strategyName: 'Euler_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Euler_CBETH: {
    contract: 'Euler',
    type: StrategyTypes.EULER,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      strategyName: 'Euler_CBETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Euler_STETH: {
    contract: 'EulerSTETH',
    type: StrategyTypes.EULER,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      strategyName: 'Euler_STETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Euler_USDC: {
    contract: 'Euler',
    type: StrategyTypes.EULER,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      strategyName: 'Euler_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Euler_Vesper_Xy_ETH_USDC: {
    contract: 'EulerVesperXy',
    type: StrategyTypes.EULER_VESPER_XY,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      eulerExec: Address.Euler.Exec,
      rewardDistributor: Address.Euler.EulDistributor,
      rewardToken: Address.Euler.EUL,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'Euler_Vesper_Xy_ETH_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Euler_Vesper_Xy_CBETH_USDC: {
    contract: 'EulerVesperXy',
    type: StrategyTypes.EULER_VESPER_XY,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      eulerExec: Address.Euler.Exec,
      rewardDistributor: Address.Euler.EulDistributor,
      rewardToken: Address.Euler.EUL,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'Euler_Vesper_Xy_CBETH_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Euler_Vesper_Xy_USDC_WBTC: {
    contract: 'EulerVesperXy',
    type: StrategyTypes.EULER_VESPER_XY,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      eulerExec: Address.Euler.Exec,
      rewardDistributor: Address.Euler.EulDistributor,
      rewardToken: Address.Euler.EUL,
      borrowToken: Address.WBTC,
      vPool: Address.Vesper.vaWBTC,
      strategyName: 'Euler_Vesper_Xy_USDC_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Euler_Vesper_Xy_DAI_USDC: {
    contract: 'EulerVesperXy',
    type: StrategyTypes.EULER_VESPER_XY,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      eulerExec: Address.Euler.Exec,
      rewardDistributor: Address.Euler.EulDistributor,
      rewardToken: Address.Euler.EUL,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'Euler_Vesper_Xy_DAI_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Euler_Vesper_Xy_ETH_DAI: {
    contract: 'EulerVesperXy',
    type: StrategyTypes.EULER_VESPER_XY,
    constructorArgs: {
      swapper,
      euler: Address.Euler.Euler,
      eulerMarkets: Address.Euler.Markets,
      eulerExec: Address.Euler.Exec,
      rewardDistributor: Address.Euler.EulDistributor,
      rewardToken: Address.Euler.EUL,
      borrowToken: Address.DAI,
      vPool: Address.Vesper.vaDAI,
      strategyName: 'Euler_Vesper_Xy_ETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  CompoundV3_USDC: {
    contract: 'CompoundV3',
    type: StrategyTypes.COMPOUNDV3,
    constructorArgs: {
      swapper,
      compRewards: Address.CompoundV3.Rewards,
      rewardToken: Address.Compound.COMP,
      comet: Address.CompoundV3.cUSDCv3,
      strategyName: 'CompoundV3_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  CompoundV3_Vesper_Xy_ETH_USDC: {
    contract: 'CompoundV3VesperXy',
    type: StrategyTypes.COMPOUNDV3_VESPER_XY,
    constructorArgs: {
      swapper,
      compRewards: Address.CompoundV3.Rewards,
      rewardToken: Address.Compound.COMP,
      comet: Address.CompoundV3.cUSDCv3,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'CompoundV3_Vesper_Xy_ETH_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  CompoundV3_Vesper_Xy_LINK_USDC: {
    contract: 'CompoundV3VesperXy',
    type: StrategyTypes.COMPOUNDV3_VESPER_XY,
    constructorArgs: {
      swapper,
      compRewards: Address.CompoundV3.Rewards,
      rewardToken: Address.Compound.COMP,
      comet: Address.CompoundV3.cUSDCv3,
      borrowToken: Address.USDC,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'CompoundV3_Vesper_Xy_LINK_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  FraxLend_CRV_FRAX: {
    contract: 'FraxLend',
    type: StrategyTypes.FRAX_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.FraxLend.CRV_FRAX,
      strategyName: 'FraxLend_CRV_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  FraxLend_Vesper_Xy_ETH_FRAX: {
    contract: 'FraxLendVesperXy',
    type: StrategyTypes.FRAX_LEND_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.FraxLend.WETH_FRAX,
      borrowToken: Address.FRAX,
      vPool: Address.Vesper.vaFRAX,
      vsp: Address.Vesper.VSP,
      strategyName: 'FraxLend_Vesper_Xy_ETH_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },
  FraxLend_Vesper_Xy_WBTC_FRAX: {
    contract: 'FraxLendVesperXy',
    type: StrategyTypes.FRAX_LEND_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.FraxLend.WBTC_FRAX,
      borrowToken: Address.FRAX,
      vPool: Address.Vesper.vaFRAX,
      vsp: Address.Vesper.VSP,
      strategyName: 'FraxLend_Vesper_Xy_WBTC_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Yearn_ETH: {
    contract: 'Yearn',
    type: StrategyTypes.YEARN,
    constructorArgs: {
      swapper,
      receiptToken: Address.Yearn.yvWETH,
      strategyName: 'Yearn_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
