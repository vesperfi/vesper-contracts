'use strict'

const hre = require('hardhat')
const Address = require('../config/mainnet/address')
const OptimismAddress = require('../config/optimism/address')
const BaseAddress = require('../config/base/address')
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
    [Address.Aave.stkAAVE]: '0x80845058350B8c3Df5c3015d8a717D64B3bF9267',
    [Address.stETH]: '0x1982b2F5814301d4e9a8b0201555376e62F82428',
    [Address.Saddle.FRAXBP_LP]: '0xfb516cf3710fc6901f2266aaeb8834cf5e4e9558',
    [Address.Curve.CRV]: '0x8dAE6Cb04688C62d939ed9B68d32Bc62e49970b1',
    [Address.Stargate.STG]: '0x8A27E7e98f62295018611DD681Ec47C7d9FF633A',
    [Address.rETH]: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    [Address.cbETH]: '0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78c',
    [Address.Metronome.msETH]: '0xa4c567c662349BeC3D0fB94C4e7f85bA95E208e4',
    [Address.Metronome.msUSD]: '0xc3b19502F8c02be75F3f77fd673503520DEB51dD',
  },
  optimism: {
    // Optimism
    [OptimismAddress.wstETH]: '0xc45A479877e1e9Dfe9FcD4056c699575a1045dAA',
    [OptimismAddress.Yearn.yvOP]: '0xf5d9d6133b698ce29567a90ab35cfb874204b3a7',
    [OptimismAddress.USDCe]: '0x86bb63148d17d445ed5398ef26aa05bf76dd5b59',
    [OptimismAddress.USDCn]: '0x8af3827a41c26c7f32c81e93bb66e837e0210d5c',
    [OptimismAddress.Stargate.STG]: '0x43d2761ed16C89A2C4342e2B16A3C61Ccf88f05B',
  },
  base: {
    // Base
    [BaseAddress.ExtraFinance.EXTRA]: '0x89f0885da2553232aeef201692f8c97e24715c83',
    [BaseAddress.USDC]: '0xd5c41fd4a31eaaf5559ffcc60ec051fcb8ecc375',
    [BaseAddress.WETH]: '0x628ff693426583D9a7FB391E54366292F509D457',
    [BaseAddress.Stargate.STG]: '0xb680190fB16f417647e69D6A84719aE9c7E5E20a',
    [BaseAddress.cbETH]: '0x3bf93770f2d4a794c3d9EBEfBAeBAE2a8f09A5E5',
    [BaseAddress.wstETH]: '0x627Fe393Bc6EdDA28e99AE648fD6fF362514304b',
    [BaseAddress.Metronome.msETH]: '0xDE4FB30cCC2f1210FcE2c8aD66410C586C8D1f9A',
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
