'use strict'

const hre = require('hardhat')
const Address = require('../config/mainnet/address')
const AvalancheAddress = require('../config/avalanche/address')
const PolygonAddress = require('../config/polygon/address')
const OptimismAddress = require('../config/optimism/address')
const BscAddress = require('../config/bsc/address')
const ethers = hre.ethers
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const BigNumber = ethers.BigNumber
const { hexlify, solidityKeccak256, zeroPad, getAddress, hexStripZeros } = ethers.utils

const { getChain } = require('./chains')

// Slot number mapping for a token. Prepared using utility https://github.com/kendricktan/slot20
const slots = {
  mainnet: {
    [Address.DAI]: 2,
    [Address.WETH]: 3,
    [Address.USDC]: 9,
    [Address.USDT]: 2,
    [Address.WBTC]: 0,
    [Address.UNI]: 4,
    [Address.MIM]: 0,
    [Address.ALUSD]: 1,
    [Address.LINK]: 1,
    [Address.APE]: 0,
    [Address.MUSD]: 51,
    [Address.DPI]: 0,
    [Address.Vesper.VSP]: 0,
    [Address.Compound.cDAI]: 14,
    [Address.Compound.COMP]: 1,
    [Address.FEI]: 0,
    [Address.FRAX]: 0,
    [Address.APE]: 0,
    [Address.MUSD]: 51,
    [Address.LMR]: 0,
    [Address.SHIB]: 0,
    [Address.Vesper.vaDAI]: 0,
    [Address.Vesper.vaFEI]: 0,
    [Address.Vesper.vaFRAX]: 0,
    [Address.Vesper.vaLINK]: 0,
    [Address.Vesper.vaWBTC]: 0,
  },
  avalanche: {
    // Avalanche addresses
    [AvalancheAddress.DAIe]: 0,
    [AvalancheAddress.USDC]: 9,
    [AvalancheAddress.USDCe]: 0,
    [AvalancheAddress.WBTCe]: 0,
    [AvalancheAddress.WETHe]: 0,
    [AvalancheAddress.WRAPPED_NATIVE_TOKEN]: 3, // WAVAX
    [AvalancheAddress.Benqi.QI]: 1,
    [AvalancheAddress.Vesper.VSP]: 2,
  },
  polygon: {
    // Polygon addresses
    [PolygonAddress.DAI]: 0,
    [PolygonAddress.USDC]: 0,
    [PolygonAddress.USDT]: 0,
    [PolygonAddress.WBTC]: 0,
    [PolygonAddress.WETH]: 0,
    [PolygonAddress.WRAPPED_NATIVE_TOKEN]: 3, // WMATIC
  },
  optimism: {
    // Optimism addresses
    [OptimismAddress.WRAPPED_NATIVE_TOKEN]: 3, // WETH
    [OptimismAddress.Curve.CRV]: 0,
    [OptimismAddress.USDC]: 0,
    [OptimismAddress.OP]: 0,
    [OptimismAddress.Sonne.SONNE]: 0,
    [OptimismAddress.ExtraFinance.EXTRA]: 0,
  },
}

// Some tokens, specially rebase tokens, uses dynamic storage or multi storage hence
// there is no clear balanceOf storage so using whale address for adjusting balance
const whales = {
  mainnet: {
    [Address.Aave.stkAAVE]: '0x4a49985b14bd0ce42c25efde5d8c379a48ab02f3',
    [Address.stETH]: '0x1982b2F5814301d4e9a8b0201555376e62F82428',
    [Address.Saddle.FRAXBP_LP]: '0xfb516cf3710fc6901f2266aaeb8834cf5e4e9558',
    [Address.Curve.CRV]: '0x8dAE6Cb04688C62d939ed9B68d32Bc62e49970b1',
    [Address.Euler.EUL]: '0xc697BB6625D9f7AdcF0fbf0cbd4DcF50D8716cd3',
    [Address.Stargate.STG]: '0x8A27E7e98f62295018611DD681Ec47C7d9FF633A',
    [Address.rETH]: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    [Address.cbETH]: '0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78c',
  },
  avalanche: {
    // Avalanche
    [AvalancheAddress.Curve.CRV]: '0xabc000d88f23bb45525e447528dbf656a9d55bf5',
    [AvalancheAddress.Stargate.STG]: '0x2B065946d41ADf43BBc3BaF8118ae94Ed19D7A40',
  },
  bsc: {
    // BSC
    [BscAddress.BUSD]: '0x0000000000000000000000000000000000001004',
    [BscAddress.WBNB]: '0x0ed7e52944161450477ee417de9cd3a859b14fd0',
    [BscAddress.Alpaca.ALPACA]: '0xb7d85ab25b9d478961face285fa3d8aaecad24a9',
    [BscAddress.Stargate.STG]: '0x6e690075eedBC52244Dd4822D9F7887d4f27442F',
  },
  optimism: {
    // Optimism
    [OptimismAddress.wstETH]: '0xc45A479877e1e9Dfe9FcD4056c699575a1045dAA',
    [OptimismAddress.Yearn.yvOP]: '0xf5d9d6133b698ce29567a90ab35cfb874204b3a7',
    [OptimismAddress.USDCe]: '0x86bb63148d17d445ed5398ef26aa05bf76dd5b59',
    [OptimismAddress.USDCn]: '0x8af3827a41c26c7f32c81e93bb66e837e0210d5c',
  },
}

/**
 * Get Whale address for given token
 * @param {string} token token address
 * @returns {string} Whale address
 */
const getWhale = function (token) {
  const whaleInfo = whales[getChain()]
  if (whaleInfo) {
    return whaleInfo[getAddress(token)]
  }
  return undefined
}

/**
 * Get slot number for a token
 *
 * @param {string} token  token address
 * @returns {number} slot number for provided token address
 */
const getSlot = function (token) {
  const slotInfo = slots[getChain()]
  if (slotInfo) {
    return slotInfo[getAddress(token)]
  }
  return undefined
}

async function getBalanceFromWhale(token, targetAddress, balance) {
  const whale = getWhale(token)
  if (whale === undefined) {
    throw new Error(`Missing slot and whale, both, configuration for token ${token} . At least one is required`)
  }
  const tokenObj = await ethers.getContractAt('ERC20', token)
  const whaleBalance = await tokenObj.balanceOf(whale)
  if (whaleBalance.lt(balance)) {
    throw new Error(`${token} whale has less token balance than requested`)
  }
  await helpers.setBalance(whale, ethers.utils.parseEther('1'))
  const whaleSigner = await ethers.getImpersonatedSigner(whale)
  await tokenObj.connect(whaleSigner).transfer(targetAddress, balance)
  return tokenObj.balanceOf(targetAddress)
}

/**
 * Update token balance for a given target address
 *
 * @param {string} token  token address
 * @param {string} targetAddress address at which token balance to be updated.
 * @param {BigNumber|string|number} balance balance amount to be set, in wei
 * @returns {Promise<BigNumber>} Actual balance after balance adjustment
 */

async function adjustBalance(token, targetAddress, balance, slot) {
  if (slot === undefined) {
    // eslint-disable-next-line no-param-reassign
    slot = getSlot(token)
    if (slot === undefined) {
      return getBalanceFromWhale(token, targetAddress, balance)
    }
  }
  // reason: https://github.com/nomiclabs/hardhat/issues/1585 comments
  // Create solidity has for index, convert it into hex string and remove all the leading zeros
  const index = hexStripZeros(hexlify(solidityKeccak256(['uint256', 'uint256'], [targetAddress, slot])))
  const value = hexlify(zeroPad(BigNumber.from(balance).toHexString(), 32))

  // Hack the balance by directly setting the EVM storage
  await helpers.setStorageAt(token, index, value)
  await helpers.mine(1)
  return balance
}

module.exports = { adjustBalance }
