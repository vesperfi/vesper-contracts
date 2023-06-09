'use strict'
require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('hardhat-log-remover')
require('dotenv').config()

const junk = 'test test test test test test test test test test test junk'

if (process.env.RUN_CONTRACT_SIZER === 'true') {
  require('hardhat-contract-sizer')
}

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      saveDeployments: true,
      timeout: 1000000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
    hardhat: {
      chainId: 1,
      initialBaseFeePerGas: 0,
      forking: {
        url: process.env.NODE_URL,
        blockNumber: process.env.BLOCK_NUMBER ? parseInt(process.env.BLOCK_NUMBER) : undefined,
      },
      saveDeployments: true,
    },
    mainnet: {
      url: process.env.NODE_URL,
      chainId: 1,
      gas: 6700000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
    goerli: {
      url: process.env.NODE_URL,
      chainId: 5,
      gas: 12000000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
    polygon: {
      url: process.env.NODE_URL,
      chainId: 137,
      gas: 11700000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
    avalanche: {
      url: process.env.NODE_URL,
      chainId: 43114,
      gas: 8000000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
    bsc: {
      url: process.env.NODE_URL,
      chainId: 56,
      gas: 8000000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
    optimism: {
      url: process.env.NODE_URL,
      chainId: 10,
      gas: 8000000,
      accounts: { mnemonic: process.env.MNEMONIC || junk },
    },
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    noColors: true,
    outputFile: 'gas-report.txt',
  },
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    },
  },
  mocha: {
    timeout: 400000,
  },
}
