'use strict'
require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('hardhat-log-remover')
require('dotenv').config()

require('./tasks/hardhat-hook')

const junk = 'test test test test test test test test test test test junk'

if (process.env.RUN_CONTRACT_SIZER === 'true') {
  require('hardhat-contract-sizer')
}

// Hardhat do not support adding chainId at runtime. Only way to set it in hardhat-config.js
// More info https://github.com/NomicFoundation/hardhat/issues/2167
// To avoid creating a new ENV VAR to store chainId, this function resolves it based on provider url
function resolveChainId() {
  const { NODE_URL } = process.env
  if (NODE_URL.includes('eth.connect')) {
    return 1
  }
  if (NODE_URL.includes('avax')) {
    return 43114
  }
  return 31337
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
      initialBaseFeePerGas: 0,
      chainId: resolveChainId(),
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
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
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
