'use strict'

const { ethers } = require('hardhat')
const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')
const { CurvePoolTypes } = require('../../utils/curvePoolTypes')

const swapper = Address.Vesper.newSwapper
const masterOracle = Address.Vesper.MasterOracle
const config = { debtRatio: 0, externalDepositFee: 0 }

const setup = {
  feeCollector: Address.Vesper.FEE_COLLECTOR,
  keepers: [Address.Vesper.KEEPER],
}

/* eslint-disable camelcase */
const StrategyConfig = {
  AaveV3_Vesper_Xy_ETH_USDC: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aOptWETH,
      borrowToken: Address.USDC,
      aaveAddressProvider: Address.Aave.AddressProvider,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'AaveV3_Vesper_Xy_ETH_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },
  AaveV3_Vesper_Xy_OP_USDC: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aOptOP,
      borrowToken: Address.USDC,
      aaveAddressProvider: Address.Aave.AddressProvider,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'AaveV3_Vesper_Xy_OP_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },
  AaveV3_Vesper_Xy_wstETH_USDC: {
    contract: 'AaveV3VesperXy',
    type: StrategyTypes.AAVE_V3_VESPER_XY,
    constructorArgs: {
      swapper,
      receiptToken: Address.Aave.aOptwstETH,
      borrowToken: Address.USDC,
      aaveAddressProvider: Address.Aave.AddressProvider,
      vPool: Address.Vesper.vaUSDC,
      strategyName: 'AaveV3_Vesper_Xy_wstETH_USDC',
    },
    config: { ...config }, // Shallow copy
    setup: { ...setup },
  },
  Curve_sETH_ETH: {
    contract: 'CurveETH',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SETH_ETH_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      crvDeposit: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_sETH_ETH',
      wethLike: Address.WETH,
    },
    config: { ...config },
    setup: { ...setup },
  },
  Curve_wstETH_ETH: {
    contract: 'CurveETH',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.WSTETH_ETH_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      crvDeposit: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 100, // 1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_wstETH_ETH',
      wethLike: Address.WETH,
    },
    config: { ...config },
    setup: { ...setup },
  },
  Curve_sUSD_USDC: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SUSD_POOL,
      curvePoolType: CurvePoolTypes.META_4_POOL,
      depositZap: Address.Curve.FACTORY_METAPOOL_DEPOSIT_ZAP,
      crvToken: Address.Curve.CRV,
      crvSlippage: 250, // 2.5%
      masterOracle,
      swapper,
      collateralIdx: 2,
      strategyName: 'Curve_sUSD_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Curve_FRAXBP_USDC: {
    contract: 'Curve',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.FRAXBP_POOL,
      curvePoolType: CurvePoolTypes.PLAIN_2_POOL,
      depositZap: ethers.constants.AddressZero,
      crvToken: Address.Curve.CRV,
      crvSlippage: 250, // 2.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_FRAXBP_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Sonne_USDC: {
    contract: 'Sonne',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Sonne.Unitroller,
      rewardToken: Address.Sonne.SONNE,
      receiptToken: Address.Sonne.soUSDC,
      strategyName: 'Sonne_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Sonne_WETH: {
    contract: 'Sonne',
    type: StrategyTypes.COMPOUND,
    constructorArgs: {
      swapper,
      comptroller: Address.Sonne.Unitroller,
      rewardToken: Address.Sonne.SONNE,
      receiptToken: Address.Sonne.soWETH,
      strategyName: 'Sonne_WETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Sonne_Leverage_ETH: {
    contract: 'SonneLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Sonne.Unitroller,
      rewardToken: Address.Sonne.SONNE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Sonne.soWETH,
      strategyName: 'Sonne_Leverage_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Sonne_Leverage_OP: {
    contract: 'SonneLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Sonne.Unitroller,
      rewardToken: Address.Sonne.SONNE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Sonne.soOP,
      strategyName: 'Sonne_Leverage_OP',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Sonne_Leverage_USDC: {
    contract: 'SonneLeverage',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      comptroller: Address.Sonne.Unitroller,
      rewardToken: Address.Sonne.SONNE,
      aaveAddressProvider: Address.Aave.AddressProvider,
      receiptToken: Address.Sonne.soUSDC,
      strategyName: 'Sonne_Leverage_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
