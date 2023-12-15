'use strict'

const Address = require('./address')
const setup = { universalFee: 200, keeper: Address.Vesper.PoolKeeper, maintainer: Address.Vesper.PoolMaintainer }

const rewards = { contract: 'PoolRewards', tokens: [Address.Vesper.VSP] }

const PoolConfig = {
  VDAI: {
    contractName: 'VPool',
    poolParams: ['vDAI Pool', 'vDAI', Address.DAI],
    setup: { ...setup }, // Shallow copy
    rewards: { ...rewards },
  },
  VADAI: {
    contractName: 'VPool',
    poolParams: ['vaDAI Pool', 'vaDAI', Address.DAI],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VETH: {
    contractName: 'VETH',
    poolParams: ['vETH Pool', 'vETH', Address.WETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAETH: {
    contractName: 'VETH',
    poolParams: ['vaETH Pool', 'vaETH', Address.WETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAWBTC: {
    contractName: 'VPool',
    poolParams: ['vaWBTC Pool', 'vaWBTC', Address.WBTC],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VLINK: {
    contractName: 'VPool',
    poolParams: ['vLINK Pool', 'vLINK', Address.LINK],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VUNI: {
    contractName: 'VPool',
    poolParams: ['vUNI Pool', 'vUNI', Address.UNI],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAUNI: {
    contractName: 'VPool',
    poolParams: ['vaUNI Pool', 'vaUNI', Address.UNI],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VUSDC: {
    contractName: 'VPool',
    poolParams: ['vUSDC Pool', 'vUSDC', Address.USDC],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAUSDC: {
    contractName: 'VPool',
    poolParams: ['vaUSDC Pool', 'vaUSDC', Address.USDC],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAUSDT: {
    contractName: 'VPool',
    poolParams: ['vaUSDT Pool', 'vaUSDT', Address.USDT],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VMIM: {
    contractName: 'VPool',
    poolParams: ['vMIM Pool', 'vMIM', Address.MIM],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAFEI: {
    contractName: 'VPool',
    poolParams: ['vaFEI Pool', 'vaFEI', Address.FEI],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAFRAX: {
    contractName: 'VPool',
    poolParams: ['vaFRAX Pool', 'vaFRAX', Address.FRAX],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAALUSD: {
    contractName: 'VPool',
    poolParams: ['vaALUSD Pool', 'vaALUSD', Address.ALUSD],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VADPI: {
    contractName: 'VPool',
    poolParams: ['vaDPI Pool', 'vaDPI', Address.DPI],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VALINK: {
    contractName: 'VPool',
    poolParams: ['vaLINK Pool', 'vaLINK', Address.LINK],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAMUSD: {
    contractName: 'VPool',
    poolParams: ['vaMUSD Pool', 'vaMUSD', Address.MUSD],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VAAPE: {
    contractName: 'VPool',
    poolParams: ['vaAPE Pool', 'vaAPE', Address.APE],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VASTETH: {
    contractName: 'VPool',
    poolParams: ['vaSTETH Pool', 'vaSTETH', Address.stETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VARETH: {
    contractName: 'VPool',
    poolParams: ['vaRETH Pool', 'vaRETH', Address.rETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
  VACBETH: {
    contractName: 'VPool',
    poolParams: ['vaCBETH Pool', 'vaCBETH', Address.cbETH],
    setup: { ...setup },
    rewards: { ...rewards },
  },
}

module.exports = Object.freeze(PoolConfig)
