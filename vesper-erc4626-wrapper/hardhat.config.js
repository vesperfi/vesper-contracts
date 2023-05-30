'use strict'
require('@nomicfoundation/hardhat-toolbox')
require('hardhat-deploy')
require('hardhat-log-remover')
require('dotenv').config()
require('./tasks/create-release')

if (process.env.RUN_CONTRACT_SIZER === 'true') {
  require('hardhat-contract-sizer')
}

// Hardhat do not support adding chainId at runtime. Only way to set it in hardhat-config.js
// More info https://github.com/NomicFoundation/hardhat/issues/2167
// To avoid creating a new ENV VAR to store chainId, this function resolves it based on provider url
function resolveChainId() {
  const nodeUrl = process.env.NODE_URL || 'http://localhost:8545'
  if (['eth.connect', 'eth.mainnet', 'mainnet.infura'].some(v => nodeUrl.includes(v))) {
    return { chainId: 1, deploy: ['deploy/mainnet'] }
  }
  if (nodeUrl.includes('avax')) {
    return { chainId: 43114, deploy: ['deploy/avalanche'] }
  }
  if (['optimism', 'opt'].some(v => nodeUrl.includes(v))) {
    return { chainId: 10, deploy: ['deploy/optimism'] }
  }
  if (nodeUrl.includes('polygon')) {
    return { chainId: 137, deploy: ['deploy/polygon'] }
  }

  return 31337
}

const { chainId, deploy } = resolveChainId()

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
      chainId,
      deploy,
    },
    hardhat: {
      initialBaseFeePerGas: 0,
      forking: {
        url,
        blockNumber: process.env.BLOCK_NUMBER ? parseInt(process.env.BLOCK_NUMBER) : undefined,
      },
      saveDeployments: true,
      chainId,
    },
    mainnet: {
      url,
      chainId: 1,
      gas: 6700000,
      accounts,
      deploy,
    },
    polygon: {
      url,
      chainId: 137,
      gas: 11700000,
      accounts,
      deploy,
    },
    avalanche: {
      url,
      chainId: 43114,
      gas: 8000000,
      accounts,
      deploy,
    },
    bsc: {
      url,
      chainId: 56,
      gas: 8000000,
      accounts,
      deploy,
    },
    optimism: {
      url,
      chainId: 10,
      gas: 8000000,
      accounts,
      deploy,
    },
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
