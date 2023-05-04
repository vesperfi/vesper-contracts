'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { BigNumber } = require('ethers')
const { getChainData } = require('vesper-commons/utils/chains')
const address = getChainData().address
const DECIMAL = BigNumber.from('1000000000000000000')
const SUSHI_ROUTER = address.SUSHI_ROUTER
const NATIVE_TOKEN = address.NATIVE_TOKEN

async function getEthQuote(ethAmount, toToken) {
  const uni = await ethers.getContractAt('IUniswapRouterTest', SUSHI_ROUTER)
  const path = [NATIVE_TOKEN, toToken]
  const amountIn = BigNumber.from(ethAmount).mul(DECIMAL)
  const retAmount = (await uni.getAmountsOut(amountIn, path))[1]
  expect(retAmount).to.be.gt('0', 'Token balance is not correct')
  return retAmount
}

async function sendEth(from, to, amount) {
  await ethers.provider.send('eth_sendTransaction', [
    {
      from,
      to,
      value: amount.toHexString(),
    },
  ])
}

module.exports = { getEthQuote, sendEth }
