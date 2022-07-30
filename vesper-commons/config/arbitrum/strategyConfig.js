'use strict'

const Address = require('./address')
const StrategyTypes = require('../../utils/strategyTypes')

const swapManager = Address.Vesper.SWAP_MANAGER
const config = { debtRatio: 0, externalDepositFee: 0 }

const setup = {
  feeCollector: Address.Vesper.FEE_COLLECTOR,
  keepers: [Address.Vesper.KEEPER],
}

// TODO update setup to remove strategy type, once done remove type from heres too
/* eslint-disable camelcase */
const StrategyConfig = {
  Curve_2pool_USDC: {
    contract: 'Curve2PlainPool',
    type: StrategyTypes.CURVE,
    constructorArgs: {
      crvPool: Address.Curve.USDCUSDT_POOL,
      swapManager,
      collateralIdx: 0,
      strategyName: 'Curve_2pool_USDC',
    },
    config: { ...config },
    setup: { ...setup },
  },
}

module.exports = Object.freeze(StrategyConfig)
