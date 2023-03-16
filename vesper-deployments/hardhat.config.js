'use strict'

require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('hardhat-log-remover')
require('dotenv').config()
require('./tasks/create-release')
require('./tasks/deploy-core-contracts')
require('./tasks/strategy-configuration')
require('./tasks/hardhat-hook')

if (process.env.RUN_CONTRACT_SIZER === 'true') {
  require('hardhat-contract-sizer')
}

const url = process.env.NODE_URL || 'http://localhost:8545'
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
      url,
      chainId: 56,
      gas: 8000000,
      accounts,
    },
    optimism: {
      url,
      chainId: 10,
      gas: 8000000,
      accounts,
    },
  },
  paths: {
    sources: process.env.SOURCES_DIR || './contracts',
  },
  namedAccounts: {
    deployer: process.env.DEPLOYER || 0,
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
