'use strict'

const hre = require('hardhat')
const Address = require('../config/mainnet/address')
const AvalancheAddress = require('../config/avalanche/address')
const PolygonAddress = require('../config/polygon/address')
const ethers = hre.ethers
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const BigNumber = ethers.BigNumber
const { hexlify, solidityKeccak256, zeroPad, getAddress, hexStripZeros } = ethers.utils

// Slot number mapping for a token. Prepared using utility https://github.com/kendricktan/slot20
const slots = {
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
  [Address.Aave.stkAAVE]: 0,
  [Address.LMR]: 0,
  [Address.SHIB]: 0,
  [Address.Vesper.vaDAI]: 0,
  [Address.Vesper.vaFEI]: 0,
  [Address.Vesper.vaFRAX]: 0,
  [Address.Vesper.vaLINK]: 0,
  [Address.Vesper.vaWBTC]: 0,

  // Avalanche addresses
  [AvalancheAddress.DAIe]: 0,
  [AvalancheAddress.USDC]: 9,
  [AvalancheAddress.USDCe]: 0,
  [AvalancheAddress.WBTCe]: 0,
  [AvalancheAddress.WETHe]: 0,
  [AvalancheAddress.NATIVE_TOKEN]: 3, // WAVAX
  [AvalancheAddress.Benqi.QI]: 1,
  [AvalancheAddress.Vesper.VSP]: 2,

  // Polygon addresses
  [PolygonAddress.DAI]: 0,
  [PolygonAddress.USDC]: 0,
  [PolygonAddress.USDT]: 0,
  [PolygonAddress.WBTC]: 0,
  [PolygonAddress.WETH]: 0,
  [PolygonAddress.NATIVE_TOKEN]: 3, // WMATIC
}

// Some tokens, specially rebase tokens, uses dynamic storage or multi storage hence
// there is no clear balanceOf storage so using whale address for adjusting balance
const whales = {
  [Address.stETH]: '0x1982b2F5814301d4e9a8b0201555376e62F82428',
}

/**
 * Get Whale address for given token
 * @param {string} token token address
 * @returns {string} Whale address
 */
const getWhale = token => whales[getAddress(token)]

/**
 * Get slot number for a token
 *
 * @param {string} token  token address
 * @returns {number} slot number for provided token address
 */
const getSlot = token => slots[getAddress(token)]

async function getBalanceFromWhale(token, targetAddress, balance) {
  const whale = getWhale(token)
  if (whale === undefined) {
    throw new Error(`Missing slot and whale, both, configuration for token ${token}. At least one is required`)
  }
  const tokenObj = await ethers.getContractAt('ERC20', token)
  const whaleBalance = await tokenObj.balanceOf(whale)
  if (whaleBalance.lt(balance)) {
    throw new Error('Whale has less token balance than requested')
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

async function adjustBalance(token, targetAddress, balance) {
  const slot = getSlot(token)
  if (slot === undefined) {
    return getBalanceFromWhale(token, targetAddress, balance)
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
