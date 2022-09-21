'use strict'

const { ethers } = require('hardhat')
const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')

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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
      strategyName: 'AaveV2_Vesper_Xy_WBTC_FRAX',
    },
    config: { ...config },
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
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
      vsp: Address.Vesper.VSP,
      strategyName: 'Compound_Vesper_Xy_WBTC_LINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  IronBankXYStrategyETH_DAI: {
    contract: 'IronBankXYStrategy',
    type: StrategyTypes.COMPOUND_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.IronBank.Unitroller,
      receiptToken: Address.IronBank.iWETH,
      borrowCToken: Address.IronBank.iDAI,
      strategyName: 'IronBankXYStrategyETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  IronBankXYStrategyDPI_DAI: {
    contract: 'IronBankXYStrategy',
    type: StrategyTypes.COMPOUND_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.IronBank.Unitroller,
      receiptToken: Address.IronBank.iDPI,
      borrowCToken: Address.IronBank.iDAI,
      strategyName: 'IronBankXYStrategyDPI_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  VesperIronBankXYStrategyETH_DAI: {
    contract: 'VesperIronBankXYStrategy',
    type: StrategyTypes.COMPOUND_VESPER_XY,
    constructorArgs: {
      swapper,
      comptroller: Address.IronBank.Unitroller,
      receiptToken: Address.IronBank.iWETH,
      borrowCToken: Address.IronBank.iDAI,
      vPool: Address.Vesper.vaDAI,
      vsp: Address.Vesper.VSP,
      strategyName: 'VesperIronBankXYStrategyETH_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyDAI: {
    contract: 'RariFuseStrategy',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 23, // default
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyUSDC: {
    contract: 'RariFuseStrategy',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 23, // default
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyWBTC: {
    contract: 'RariFuseStrategy',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 23, // default
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyETH: {
    contract: 'RariFuseStrategyETH',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 23, // default
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategyETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyFEI: {
    contract: 'RariFuseStrategy',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 8,
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyFRAX: {
    contract: 'RariFuseStrategy',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 18,
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseStrategyAPE: {
    contract: 'RariFuseStrategyAPE',
    type: StrategyTypes.RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 127,
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseLeverageStrategyDAI: {
    contract: 'RariFuseLeverageStrategy',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      aaveAddressProvider: Address.Aave.AddressProvider,
      fusePoolId: 8,
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseLeverageStrategyDAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  RariFuseLeverageStrategyFEI: {
    contract: 'RariFuseLeverageStrategy',
    type: StrategyTypes.COMPOUND_LEVERAGE,
    constructorArgs: {
      swapper,
      aaveAddressProvider: Address.Aave.AddressProvider,
      fusePoolId: 8,
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      strategyName: 'RariFuseLeverageStrategyFEI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  EarnRariFuseStrategy: {
    contract: 'EarnRariFuseStrategy',
    type: StrategyTypes.EARN_RARI_FUSE,
    constructorArgs: {
      swapper,
      fusePoolId: 23, // default,
      fusePoolDirectory: Address.Rari.fusePoolDirectory,
      dripToken: Address.DAI,
      strategyName: 'EarnRariFuseStrategy',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyDAI: {
    contract: 'AlphaLendStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibDAIv2,
      strategyName: 'AlphaLendStrategyDAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyDPI: {
    contract: 'AlphaLendStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibDPIv2,
      strategyName: 'AlphaLendStrategyDPI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyETH: {
    contract: 'AlphaLendStrategyETH',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibETHv2,
      strategyName: 'AlphaLendStrategyETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyLINK: {
    contract: 'AlphaLendStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibLINKv2,
      strategyName: 'AlphaLendStrategyLINK',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyUSDC: {
    contract: 'AlphaLendStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibUSDCv2,
      strategyName: 'AlphaLendStrategyUSDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  AlphaLendStrategyUSDT: {
    contract: 'AlphaLendStrategy',
    type: StrategyTypes.ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibUSDTv2,
      strategyName: 'AlphaLendStrategyUSDT',
    },
    config: { ...config },
    setup: { ...setup },
  },

  EarnAlphaLendStrategyETH: {
    contract: 'EarnAlphaLendStrategyETH',
    type: StrategyTypes.EARN_ALPHA_LEND,
    constructorArgs: {
      swapper,
      receiptToken: Address.Alpha.ibETHv2,
      dripToken: Address.DAI,
      strategyName: 'EarnAlphaLendStrategyETH',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_ren_WBTC: {
    contract: 'Convex2PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.REN_POOL,
      crvSlippage: 50, // 0.5%
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
    contract: 'Convex2PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_USDC_POOL,
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
    contract: 'Convex3PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.THREE_POOL,
      crvSlippage: 10, // 0.1%
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
    contract: 'Convex3PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.SBTC_POOL,
      crvSlippage: 200, // 2.0%
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
    contract: 'Convex3PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.D3_POOL,
      crvSlippage: 150, // 1.5%
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
    contract: 'Convex3PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.D3_POOL,
      crvSlippage: 100, // 1%
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
    contract: 'Convex3PlainPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.D3_POOL,
      crvSlippage: 150, // 1.5%
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
    contract: 'Convex4FactoryMetaPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.MIM_3CRV_POOL,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      deposit: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      collateralIdx: 0,
      convexPoolId: 40,
      strategyName: 'Convex_mim_MIM',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_musd_MUSD: {
    contract: 'Convex4MetaPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.MUSD_POOL,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      deposit: Address.Curve.MUSD_DEPOSIT,
      collateralIdx: 0,
      convexPoolId: 14,
      strategyName: 'Convex_musd_MUSD',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_frax_FRAX: {
    contract: 'Convex4FactoryMetaPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_3CRV_POOL,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      deposit: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      collateralIdx: 0,
      convexPoolId: 32,
      strategyName: 'Convex_frax_FRAX',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_frax_DAI: {
    contract: 'Convex4FactoryMetaPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_3CRV_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      deposit: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      collateralIdx: 1,
      convexPoolId: 32,
      strategyName: 'Convex_frax_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_frax_USDC: {
    contract: 'Convex4FactoryMetaPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.FRAX_3CRV_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      deposit: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      collateralIdx: 2,
      convexPoolId: 32,
      strategyName: 'Convex_frax_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Convex_ibBTC_WBTC: {
    contract: 'Convex4FactoryMetaPool',
    type: StrategyTypes.CONVEX,
    constructorArgs: {
      crvPool: Address.Curve.IBBTC_SBTC_POOL,
      crvSlippage: 150, // 1.5%
      masterOracle,
      swapper,
      deposit: Address.Curve.SBTC_DEPOSIT,
      collateralIdx: 2,
      convexPoolId: 53,
      strategyName: 'Convex_ibBTC_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_ren_WBTC: {
    contract: 'Curve2PlainPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.REN_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_ren_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_3pool_DAI: {
    contract: 'Curve3PlainPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.THREE_POOL,
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_3pool_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_3pool_USDC: {
    contract: 'Curve3PlainPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.THREE_POOL,
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
    contract: 'Curve3PlainPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SBTC_POOL,
      crvSlippage: 150, // 1.5%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_sbtc_WBTC',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_Earn_sbtc_WBTC_DAI: {
    contract: 'EarnCurve3PlainPool',
    type: StrategyTypes.EARN_CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SBTC_POOL,
      crvSlippage: 150, // 1.5%
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
    contract: 'Curve4FactoryMetaPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.MIM_3CRV_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      collateralIdx: 1,
      strategyName: 'Curve_mim_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_mim_MIM: {
    contract: 'Curve4FactoryMetaPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.MIM_3CRV_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      depositZap: Address.Curve.TRIPOOL_DEPOSIT_ZAP,
      collateralIdx: 0,
      strategyName: 'Curve_mim_MIM',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_GUSD_DAI: {
    contract: 'Curve4PlainOr4MetaPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.GUSD_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      deposit: Address.Curve.GUSD_DEPOSIT,
      collateralIdx: 1,
      strategyName: 'Curve_GUSD_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_sUSD_DAI: {
    contract: 'Curve4PlainOr4MetaPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.SUSD_POOL,
      crvSlippage: 50, // 0.5%
      masterOracle,
      swapper,
      deposit: Address.Curve.SUSD_DEPOSIT,
      collateralIdx: 0,
      strategyName: 'Curve_sUSD_DAI',
    },
    config: { ...config, externalDepositFee: 100 },
    setup: { ...setup },
  },

  Curve_aave_DAI: {
    contract: 'Curve3LendingPoolAave',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 0,
      strategyName: 'Curve_aave_DAI',
    },
    config: { ...config },
    setup: { ...setup },
  },

  Curve_aave_USDC: {
    contract: 'Curve3LendingPoolAave',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvSlippage: 10, // 0.1%
      masterOracle,
      swapper,
      collateralIdx: 1,
      strategyName: 'Curve_aave_USDC',
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
      stargateLpStaking: Address.Stargate.lpStaking,
      stargatePoolId: 1, // USDC LP Pool ID
      stargateLpStakingPoolId: 0, // Staking Contract pool ID
      strategyName: 'Stargate_USDC',
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
      markets: Address.Euler.Markets,
      protocol: Address.Euler.EulerProtocol,
      strategyName: 'Euler_ETH',
    },
    config: { ...config },
    setup: { ...setup },
  },
  Euler_USDC: {
    contract: 'Euler',
    type: StrategyTypes.EULER,
    constructorArgs: {
      swapper,
      markets: Address.Euler.Markets,
      protocol: Address.Euler.EulerProtocol,
      strategyName: 'Euler_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
