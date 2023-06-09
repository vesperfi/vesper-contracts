'use strict'

require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('hardhat-log-remover')
require('dotenv').config()
require('./tasks/create-release')
require('./tasks/deploy-core-contracts')
require('./tasks/strategy-configuration')
require('./tasks/hardhat-hook')
require('./tasks/verify-admin')

if (process.env.RUN_CONTRACT_SIZER === 'true') {
  require('hardhat-contract-sizer')
}

// Hardhat do not support adding chainId at runtime. Only way to set it in hardhat-config.js
// More info https://github.com/NomicFoundation/hardhat/issues/2167
// To avoid creating a new ENV VAR to store chainId, this function resolves it based on provider url
function resolveChainId() {
  const nodeUrl = process.env.NODE_URL || 'http://localhost:8545'
  if (['eth.connect', 'eth.mainnet', 'mainnet.infura'].some(v => nodeUrl.includes(v))) {
    return 1
  }
  if (nodeUrl.includes('avax')) {
    return 43114
  }
  if (nodeUrl.includes('bsc')) {
    return 56
  }
  if (['optimism', 'opt'].some(v => nodeUrl.includes(v))) {
    return 10
  }
  if (nodeUrl.includes('polygon')) {
    return 137
  }

  return 31337
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
      chainId: resolveChainId(),
    },
    hardhat: {
      initialBaseFeePerGas: 0,
      forking: {
        url,
        blockNumber: process.env.BLOCK_NUMBER ? parseInt(process.env.BLOCK_NUMBER) : undefined,
      },
      saveDeployments: true,
      chainId: resolveChainId(),
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
  etherscan: {
    apiKey: {
      mainnet: process.env.MAINNET_ETHERSCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISM_ETHERSCAN_API_KEY,
    },
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
