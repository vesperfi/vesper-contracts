'use strict'

require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('hardhat-log-remover')
require('dotenv').config()

require('./tasks/hardhat-hook')

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

const url = process.env.NODE_URL
const mnemonic = process.env.MNEMONIC || 'test test test test test test test test test test test junk'
const accounts = { mnemonic }

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      saveDeployments: true,
      timeout: 1000000,
      accounts,
    },
    hardhat: {
      initialBaseFeePerGas: 0,
      chainId: resolveChainId(),
      forking: {
        url,
        blockNumber: process.env.BLOCK_NUMBER ? parseInt(process.env.BLOCK_NUMBER) : undefined,
      },
      saveDeployments: true,
    },
    mainnet: {
      url,
      chainId: 1,
      gas: 6700000,
      accounts,
    },
    goerli: {
      url,
      chainId: 5,
      gas: 12000000,
      accounts,
    },
    polygon: {
      url,
      chainId: 137,
      gas: 11700000,
      accounts,
    },
    avalanche: {
      url,
      chainId: 43114,
      gas: 8000000,
      accounts,
    },
    bsc: {
      url: process.env.NODE_URL,
      chainId: 56,
      gas: 8000000,
      accounts,
    },
  },
  paths: {
    sources: process.env.SOURCES_DIR || './contracts',
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
