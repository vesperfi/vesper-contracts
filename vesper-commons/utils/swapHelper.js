'use strict'
const { ethers } = require('hardhat')
const { getChain, getChainData } = require('./chains')
const { getIfExist, unlock } = require('./contractHelper')

const chain = getChain()
const Address = getChainData().address

const SwapType = {
  EXACT_INPUT: 0,
  EXACT_OUTPUT: 1,
}

const ExchangeType = {
  NO_EXCHANGE: -1,
  UNISWAP_V2: 0,
  SUSHISWAP: 1,
  TRADERJOE: 2,
  PANGOLIN: 3,
  QUICKSWAP: 4,
  UNISWAP_V3: 5,
  PANCAKE_SWAP: 6,
  VELODROME: 7,
  AERODROME: 8,
}

const abi = [
  'function governor() external view returns(address)',
  'function routings(bytes key) external view returns(bytes)',
  'function setExactInputRouting(address tokenIn_,address tokenOut_,bytes memory _newRouting) external',
  'function setExactOutputRouting(address tokenIn_,address tokenOut_,address exchange_,bytes calldata path_) external',
]

const abiCoder = ethers.utils.defaultAbiCoder

function prepareExactInputRouting(swapInfo) {
  const routing = {
    tokenIn: swapInfo.pair.tokenIn,
    tokenOut: swapInfo.pair.tokenOut,
    calls: '',
  }
  if (swapInfo.exchange === ExchangeType.NO_EXCHANGE || swapInfo.exchange === ExchangeType.UNISWAP_V2) {
    const adapterAbi = ['function swapExactInput(address[] calldata path_) external']
    routing.calls = [
      {
        target: Address.Vesper.UniswapV2Adapter,
        data: new ethers.utils.Interface(adapterAbi).encodeFunctionData('swapExactInput', [swapInfo.path]),
        value: 0,
        isDelegateCall: true,
      },
    ]
  } else if (swapInfo.exchange === ExchangeType.UNISWAP_V3) {
    let target
    if (chain === 'base') {
      target = Address.Vesper.UniswapV3AdapterV2
    } else {
      target = Address.Vesper.UniswapV3Adapter
    }
    const adapterAbi = ['function swapExactInput(bytes calldata path_) external']
    routing.calls = [
      {
        target,
        data: new ethers.utils.Interface(adapterAbi).encodeFunctionData('swapExactInput', [swapInfo.path]),
        value: 0,
        isDelegateCall: true,
      },
    ]
  } else if (swapInfo.exchange === ExchangeType.VELODROME) {
    const adapterAbi = ['function swapExactInput(address[] calldata path_, bool[] memory stable_) external']
    routing.calls = [
      {
        target: Address.Vesper.VelodromeV2Adapter,
        data: new ethers.utils.Interface(adapterAbi).encodeFunctionData('swapExactInput', [
          swapInfo.path,
          swapInfo.stable,
        ]),
        value: 0,
        isDelegateCall: true,
      },
    ]
  } else if (swapInfo.exchange === ExchangeType.AERODROME) {
    const adapterAbi = ['function swapExactInput(address[] calldata path_, bool[] memory stable_) external']
    routing.calls = [
      {
        target: Address.Vesper.AerodromeAdapter,
        data: new ethers.utils.Interface(adapterAbi).encodeFunctionData('swapExactInput', [
          swapInfo.path,
          swapInfo.stable,
        ]),
        value: 0,
        isDelegateCall: true,
      },
    ]
  } else {
    throw new Error('Exchange %s is not supported for exactInput', swapInfo.exchange)
  }
  return routing
}

function prepareExactOutputRouting(swapInfo) {
  if (swapInfo.exchange === ExchangeType.NO_EXCHANGE || swapInfo.exchange === ExchangeType.UNISWAP_V2) {
    return {
      tokenIn: swapInfo.pair.tokenIn,
      tokenOut: swapInfo.pair.tokenOut,
      exchange: Address.Vesper.UniswapV2Adapter,
      path: abiCoder.encode(['address[]'], [swapInfo.path]),
    }
  } else if (swapInfo.exchange === ExchangeType.UNISWAP_V3) {
    let exchange
    if (chain === 'base') {
      exchange = Address.Vesper.UniswapV3AdapterV2
    } else {
      exchange = Address.Vesper.UniswapV3Adapter
    }
    // For UniV3 exactOutput, tokenOut becomes tokenIn and vice versa
    return {
      tokenIn: swapInfo.pair.tokenOut,
      tokenOut: swapInfo.pair.tokenIn,
      exchange,
      path: swapInfo.path,
    }
  }
  throw new Error('Exchange %s is not supported for exactOutput', swapInfo.exchange)
}

async function setupRoutingsInNewSwapper(swapInfoList) {
  const exactInputRoutings = []
  const exactOutputRoutings = []
  for (let swapInfo of swapInfoList) {
    exactInputRoutings.push(prepareExactInputRouting(swapInfo))
    // exact output is not supported in velodrome
    if (swapInfo.exchange !== ExchangeType.VELODROME && swapInfo.exchange !== ExchangeType.AERODROME) {
      exactOutputRoutings.push(prepareExactOutputRouting(swapInfo))
    }
  }

  const swapper = await ethers.getContractAt(abi, Address.Vesper.Swapper)
  const governor = await unlock(await swapper.governor())

  for (const { tokenIn, tokenOut, calls } of exactInputRoutings) {
    const key = ethers.utils.solidityPack(['uint8', 'address', 'address'], [SwapType.EXACT_INPUT, tokenIn, tokenOut])
    const currentRouting = await swapper.routings(key)
    const newRouting = abiCoder.encode(['(address target, bytes data, uint256 value, bool isDelegateCall)[]'], [calls])
    if (newRouting !== currentRouting) {
      await swapper.connect(governor).setExactInputRouting(tokenIn, tokenOut, newRouting)
    }
  }

  for (const { tokenIn, tokenOut, exchange, path } of exactOutputRoutings) {
    const key = ethers.utils.solidityPack(['uint8', 'address', 'address'], [SwapType.EXACT_OUTPUT, tokenIn, tokenOut])
    const currentRouting = await swapper.routings(key)
    const newRouting = abiCoder.encode(['address', 'bytes'], [exchange, path])
    if (newRouting !== currentRouting) {
      await swapper.connect(governor).setExactOutputRouting(tokenIn, tokenOut, exchange, path)
    }
  }
}

async function setupRoutingsInOldSwapper(swapperAddress, swapInfoList) {
  const oldSwapperAbi = [
    'function setDefaultRouting(uint8, address, address, uint8, bytes) external',
    'function governor() external view returns(address)',
    'function addressProvider() external view returns(address)',
    'function defaultRoutings(bytes memory) external view returns(bytes memory)',
  ]
  const swapper = await ethers.getContractAt(oldSwapperAbi, swapperAddress)

  let governor
  try {
    governor = await swapper.governor()
  } catch (e) {
    const apABI = ['function governor() external view returns(address)']
    const addressProvider = await ethers.getContractAt(apABI, await swapper.addressProvider())
    governor = await addressProvider.governor()
  }

  const caller = await unlock(governor)

  let defaultExchange
  switch (chain) {
    case 'avalanche':
      defaultExchange = ExchangeType.TRADERJOE
      break
    case 'bsc':
      defaultExchange = ExchangeType.PANCAKE_SWAP
      break
    default:
      defaultExchange = ExchangeType.UNISWAP_V2
  }

  for (let swapInfo of swapInfoList) {
    // Assign default
    if (swapInfo.exchange === ExchangeType.NO_EXCHANGE) {
      swapInfo.exchange = defaultExchange
      swapInfo.path = abiCoder.encode(['address[]'], [swapInfo.path])
    }

    const swapType = { EXACT_INPUT: 0, EXACT_OUTPUT: 1 }
    const { exchange, pair, path } = swapInfo

    await swapper.connect(caller).setDefaultRouting(swapType.EXACT_INPUT, pair.tokenIn, pair.tokenOut, exchange, path)
    if (exchange === ExchangeType.UNISWAP_V3) {
      await swapper
        .connect(caller)
        .setDefaultRouting(swapType.EXACT_OUTPUT, pair.tokenOut, pair.tokenIn, exchange, path)
    } else {
      await swapper
        .connect(caller)
        .setDefaultRouting(swapType.EXACT_OUTPUT, pair.tokenIn, pair.tokenOut, exchange, path)
    }
  }
}

// eslint-disable-next-line complexity
function prepareSwapInfo(pairs) {
  const swapInfo = []
  for (let pair of pairs) {
    let exchange = ExchangeType.NO_EXCHANGE
    let tokens = [pair.tokenIn, Address.WRAPPED_NATIVE_TOKEN, pair.tokenOut]
    if (pair.tokenIn === Address.WRAPPED_NATIVE_TOKEN || pair.tokenOut === Address.WRAPPED_NATIVE_TOKEN) {
      tokens = [pair.tokenIn, pair.tokenOut]
    }
    let path = tokens
    let stable = []
    if (chain === 'mainnet') {
      if (pair.tokenIn === Address.Stargate.STG || pair.tokenOut === Address.Stargate.STG) {
        // uni3 has pair of USDC, WETH in 0.3 fee pool.
        path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 3000, pair.tokenOut])
        exchange = ExchangeType.UNISWAP_V3
        if (pair.tokenOut == Address.DAI || pair.tokenOut == Address.FRAX) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 3000, Address.USDC, 3000, pair.tokenOut],
          )
        }
      } else if (pair.tokenIn === Address.rETH || pair.tokenOut === Address.rETH) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 500, Address.WRAPPED_NATIVE_TOKEN, 500, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.Euler.EUL) {
        if (pair.tokenOut === Address.WRAPPED_NATIVE_TOKEN) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address'],
            [pair.tokenIn, 10000, Address.WRAPPED_NATIVE_TOKEN],
          )
        } else {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 10000, Address.WRAPPED_NATIVE_TOKEN, 3000, pair.tokenOut],
          )
        }
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.cbETH || pair.tokenOut === Address.cbETH) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 500, Address.WRAPPED_NATIVE_TOKEN, 500, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.wstETH || pair.tokenOut === Address.wstETH) {
        if (pair.tokenIn === Address.WRAPPED_NATIVE_TOKEN || pair.tokenOut === Address.WRAPPED_NATIVE_TOKEN) {
          path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 100, pair.tokenOut])
          exchange = ExchangeType.UNISWAP_V3
        } else if (pair.tokenIn === Address.USDC || pair.tokenOut === Address.USDC) {
          path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 3000, pair.tokenOut])
          exchange = ExchangeType.UNISWAP_V3
        } // else do nothing
      }
    } else if (chain == 'optimism') {
      if (pair.tokenIn === Address.Sonne.SONNE || pair.tokenIn === Address.ExtraFinance.EXTRA) {
        if (pair.tokenOut === Address.OP) {
          path = [pair.tokenIn, Address.USDCe, Address.WETH, pair.tokenOut]
          stable = [false, false, false]
        } else if (pair.tokenOut === Address.USDCn) {
          path = [pair.tokenIn, Address.USDCe, pair.tokenOut]
          stable = [false, true]
        } else if (pair.tokenOut === Address.USDCe) {
          path = [pair.tokenIn, pair.tokenOut]
          stable = [false]
        } else if (pair.tokenOut === Address.WETH) {
          path = [pair.tokenIn, Address.USDCe, pair.tokenOut]
          stable = [false, false]
        } else if (pair.tokenOut === Address.wstETH) {
          path = [pair.tokenIn, Address.USDCe, pair.tokenOut]
          stable = [false, false]
        }
        exchange = ExchangeType.VELODROME
      } else if (pair.tokenOut === Address.WRAPPED_NATIVE_TOKEN) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address'],
          [pair.tokenIn, 10000, Address.WRAPPED_NATIVE_TOKEN],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 10000, Address.WRAPPED_NATIVE_TOKEN, 3000, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      }
    } else if (chain !== 'bsc' && chain !== 'base') {
      if (pair.tokenIn === Address.Curve.CRV && pair.tokenOut === Address.USDC) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 10000, Address.WRAPPED_NATIVE_TOKEN, 3000, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.Curve.CRV && pair.tokenOut === Address.FEI) {
        path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address', 'uint24', 'address'],
          [pair.tokenIn, 3000, Address.WRAPPED_NATIVE_TOKEN, 3000, pair.tokenOut],
        )
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.Curve.CRV && pair.tokenOut === Address.ALUSD) {
        path = ethers.utils.defaultAbiCoder.encode(
          ['address[]'],
          [[pair.tokenIn, Address.WRAPPED_NATIVE_TOKEN, pair.tokenOut]],
        )
        exchange = ExchangeType.SUSHISWAP
      }
    } else if (chain === 'base') {
      if (pair.tokenIn === Address.ExtraFinance.EXTRA) {
        if (pair.tokenOut === Address.USDC) {
          path = [pair.tokenIn, Address.WETH, pair.tokenOut]
          stable = [false, false]
        } else if (pair.tokenOut === Address.WETH) {
          path = [pair.tokenIn, pair.tokenOut]
          stable = [false]
        }
        exchange = ExchangeType.AERODROME
      } else if (pair.tokenIn === Address.CompoundV3.COMP) {
        if (pair.tokenOut === Address.USDC) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 10000, Address.WRAPPED_NATIVE_TOKEN, 500, pair.tokenOut],
          )
        } else if (pair.tokenOut === Address.WETH) {
          path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 10000, pair.tokenOut])
        } else if (pair.tokenOut === Address.cbETH) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 10000, Address.WETH, 100, pair.tokenOut],
          )
        }
        exchange = ExchangeType.UNISWAP_V3
      } else if (pair.tokenIn === Address.Stargate.STG) {
        path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 10000, pair.tokenOut])
        exchange = ExchangeType.UNISWAP_V3
      }

      if (pair.tokenIn === Address.cbETH || pair.tokenOut === Address.cbETH) {
        if (pair.tokenIn === Address.USDC || pair.tokenOut === Address.USDC) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 500, Address.WETH, 100, pair.tokenOut],
          )
        } else if (pair.tokenIn === Address.WETH || pair.tokenOut === Address.WETH) {
          path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 100, pair.tokenOut])
        }
        exchange = ExchangeType.UNISWAP_V3
      }

      if (pair.tokenIn === Address.wstETH || pair.tokenOut === Address.wstETH) {
        if (pair.tokenIn === Address.USDC || pair.tokenOut === Address.USDC) {
          path = ethers.utils.solidityPack(
            ['address', 'uint24', 'address', 'uint24', 'address'],
            [pair.tokenIn, 500, Address.WETH, 100, pair.tokenOut],
          )
        } else if (pair.tokenIn === Address.WETH || pair.tokenOut === Address.WETH) {
          path = ethers.utils.solidityPack(['address', 'uint24', 'address'], [pair.tokenIn, 100, pair.tokenOut])
        }
        exchange = ExchangeType.UNISWAP_V3
      }
    }

    swapInfo.push({ exchange, pair, path, stable })
  }
  return swapInfo
}

// eslint-disable-next-line complexity
async function getTokenPairs(strategies, collateral) {
  const pairs = []
  for (const strategy of strategies) {
    const strategyType = strategy.type.toLowerCase()
    const strategyName = await strategy.instance.NAME()
    const rewardToken =
      (await getIfExist(strategy.instance.rewardToken)) || (await getIfExist(strategy.instance.rewardTokens, [0]))
    if (rewardToken) {
      pairs.push({ tokenIn: rewardToken, tokenOut: collateral })
    }

    if (strategyName.includes('AaveV3')) {
      // Is strategy is AaveV3Xy
      if (strategyName.includes('Xy')) {
        // eslint-disable-next-line no-param-reassign
        collateral = await strategy.instance.wrappedCollateral()
      }
      // get reward token list from AaveIncentivesController
      const aToken = await ethers.getContractAt(
        ['function getIncentivesController() external view returns (address)'],
        await strategy.instance.receiptToken(),
      )

      try {
        const incentiveController = await ethers.getContractAt(
          ['function getRewardsList() external view returns (address[] memory)'],
          await aToken.getIncentivesController(),
        )
        const _rewardTokens = await getIfExist(incentiveController.getRewardsList)
        for (let i = 0; i < _rewardTokens.length; i++) {
          pairs.push({ tokenIn: _rewardTokens[i], tokenOut: collateral })
        }
      } catch (e) {
        /* empty */
      }
    }
    if (strategyName.includes('Curve') || strategyName.includes('Ellipsis')) {
      const rewardTokens = await strategy.instance.getRewardTokens()
      for (let i = 0; i < rewardTokens.length; i++) {
        pairs.push({ tokenIn: rewardTokens[i], tokenOut: collateral })
      }
    }
    if (strategyType.includes('xy')) {
      const token1 = collateral
      const token2 = await strategy.instance.borrowToken()
      pairs.push({ tokenIn: token1, tokenOut: token2 })
      pairs.push({ tokenIn: token2, tokenOut: token1 })
    }

    if (strategyType.includes('vesper') && Address.Vesper.VSP) {
      pairs.push({ tokenIn: Address.Vesper.VSP, tokenOut: collateral })
    }
    if (strategyType.includes('maker')) {
      pairs.push({ tokenIn: Address.DAI, tokenOut: collateral })
      pairs.push({ tokenIn: collateral, tokenOut: Address.DAI })
    }
    if (strategyType.startsWith('earn')) {
      const dripToken = await strategy.instance.dripToken()
      pairs.push({ tokenIn: collateral, tokenOut: dripToken })
    }
  }
  return pairs
}

async function setupRoutings(strategies, collateral) {
  // Get token pairs for swap
  const pairs = await getTokenPairs(strategies, collateral)
  // prepare path and exchange for each pair
  const swapInfoList = prepareSwapInfo(pairs)

  const swapperAddress = strategies[0].constructorArgs.swapper

  if (['mainnet', 'optimism', 'base'].includes(chain)) {
    await setupRoutingsInNewSwapper(swapInfoList)
  } else {
    await setupRoutingsInOldSwapper(swapperAddress, swapInfoList)
  }
}

module.exports = { setupRoutings }
