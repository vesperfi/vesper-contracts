'use strict'
const fs = require('fs')

const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
const safe = {
  mainnet: '0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A',
  optimism: '0x32934AD7b1121DeFC631080b58599A0eaAB89878',
  base: '0x32934AD7b1121DeFC631080b58599A0eaAB89878',
}

// ethers getNetwork().name returns unknown for 'base'
async function getChain() {
  const chain = {
    1: 'mainnet',
    10: 'optimism',
    8453: 'base',
  }
  const chainId = (await ethers.provider.getNetwork()).chainId
  return chain[chainId]
}

async function getProxyAdminAddress(proxyAddress) {
  const proxyAdminStorage = (await ethers.provider.getStorageAt(proxyAddress, ADMIN_SLOT)).toString()
  if (proxyAdminStorage.length === 42) {
    return ethers.utils.getAddress(proxyAdminStorage)
  }
  return ethers.utils.getAddress(`0x${proxyAdminStorage.slice(26)}`)
}

async function getImplAddress(proxyAddress) {
  const implStorage = (await ethers.provider.getStorageAt(proxyAddress, IMPLEMENTATION_SLOT)).toString()
  if (implStorage.length === 42) {
    return ethers.utils.getAddress(implStorage)
  }
  return ethers.utils.getAddress(`0x${implStorage.slice(26)}`)
}

async function getOwner(address) {
  const contract = await ethers.getContractAt(['function owner() external view returns(address)'], address)
  return contract.owner()
}

async function runValidation(input, safeAddress) {
  if (!input) {
    return null
  }
  const result = {}
  const liveAdmin = await getProxyAdminAddress(input.proxy)
  if (liveAdmin !== input.proxyAdmin) {
    result.newProxyAdmin = liveAdmin
    result.incorrectAdminInRelease = true
    result.action = 'update release file with correct proxyAdmin'
  }

  const owner = await getOwner(liveAdmin)
  if (owner !== safeAddress) {
    result.proxyAdminOwner = owner
    result.expectedProxyAdminOwner = safeAddress
    result.updateInProxyAdminRequired = true

    const chain = await getChain()
    const safeDir = `./deployments/${chain}/global/${safeAddress}`
    if (fs.existsSync(safeDir)) {
      result.action = 'changeProxyAdmin, update release file with correct proxyAdmin'
    } else {
      const ownerDir = `deployments/${chain}/global/${owner}`
      result.action = `transferOwnership of proxyAdmin, update ${ownerDir} to ${safeDir}`
    }
  }

  const liveImpl = await getImplAddress(input.proxy)
  if (liveImpl !== input.implementation) {
    result.newImplementation = liveImpl
    result.incorrectImplInRelease = true
    result.action = 'update release file with correct implementation'
  }

  return Object.keys(result).length > 0 ? result : null
}

task('verify-admin', 'Verify proxy admins are okay')
  .addParam('release', 'Vesper release')
  .setAction(async function ({ release }) {
    if (!process.env.NODE_URL) {
      throw Error('Please set NODE_URL in env')
    }

    const chain = await getChain()

    const releaseFile = `./releases/${release}/contracts.json`

    let releaseInfo
    if (!fs.existsSync(releaseFile)) {
      throw Error('Given release does not exist on given chain')
    }
    releaseInfo = fs.readFileSync(releaseFile)
    const releaseJson = JSON.parse(releaseInfo)

    const data = releaseJson.networks[chain]
    const safeAddress = safe[chain]
    const poolNames = Object.keys(data)
    const result = {}

    for (let poolName of poolNames) {
      result[poolName] = {}

      const poolData = data[poolName]

      const resultPool = await runValidation(poolData.pool, safeAddress)
      if (resultPool) {
        result[poolName].pool = resultPool
      }

      const resultPoolAccountant = await runValidation(poolData.pool.poolAccountant, safeAddress)
      if (resultPoolAccountant) {
        if (!result[poolName].pool) {
          result[poolName].pool = {}
        }
        result[poolName].pool.poolAccountant = resultPoolAccountant
      }

      const resultPoolRewards = await runValidation(poolData.poolRewards, safeAddress)
      if (resultPoolRewards) {
        result[poolName].poolRewards = resultPoolRewards
      }

      // if result is empty for pool, then delete the empty object
      if (Object.keys(result[poolName]).length === 0) {
        delete result[poolName]
      }
    }
    let output = {}
    const dir = './verify-admin-output'
    const outputFileName = `${dir}/${release}-action-item.json`

    if (fs.existsSync(outputFileName)) {
      output = JSON.parse(fs.readFileSync(outputFileName))
      output.date = new Date()
      output.networks[chain] = result
    } else {
      fs.mkdirSync(dir, { recursive: true })
      output = {
        version: release,
        date: new Date(),
        networks: {
          [chain]: result,
        },
      }
    }
    fs.writeFileSync(outputFileName, JSON.stringify(output, null, 2))
  })

module.exports = {}
