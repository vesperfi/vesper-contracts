'use strict'
const fs = require('fs')

const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
const safe = {
  avalanche: '0x98ca142b7a7856375d665B58A64FB6D29b49eF1f',
  mainnet: '0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A',
  optimism: '0x32934AD7b1121DeFC631080b58599A0eaAB89878',
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
    return {}
  }
  const result = {}
  result.proxy = input.proxy
  const liveAdmin = await getProxyAdminAddress(input.proxy)
  result.proxyAdmin = liveAdmin
  if (liveAdmin !== input.proxyAdmin) {
    result.incorrectAdminInRelease = true
  }
  const owner = await getOwner(liveAdmin)
  result.proxyAdminOwner = owner
  result.isSafeProxyAdminOwner = owner === safeAddress

  const liveImpl = await getImplAddress(input.proxy)
  result.implementation = liveImpl
  if (liveImpl !== input.implementation) {
    result.incorrectImplInRelease = true
  }
  return result
}

task('verify-admin', 'Verify proxy admins are okay')
  .addParam('release', 'Vesper release')
  .setAction(async function ({ release }) {
    if (!process.env.NODE_URL) {
      throw Error('Please set NODE_URL in env')
    }
    const chainFromProvider = (await ethers.provider.getNetwork()).name
    const chain = chainFromProvider === 'homestead' ? 'mainnet' : chainFromProvider

    const releaseFile = `./releases/${release}/contracts.json`

    let releaseInfo
    if (!fs.existsSync(releaseFile)) {
      throw Error('Given release does not exist on given chain')
    }
    releaseInfo = fs.readFileSync(releaseFile)
    const releaseJson = JSON.parse(releaseInfo)

    const data = releaseJson.networks[chain]
    const safeAddress = safe[chain]
    const keys = Object.keys(data)
    const result = {}

    for (let key of keys) {
      result[key] = {}

      const poolData = data[key]
      const pool = poolData.pool

      result[key].pool = await runValidation(pool, safeAddress)
      result[key].pool.poolAccountant = await runValidation(pool.poolAccountant, safeAddress)
      const poolRewards = await runValidation(poolData.poolRewards, safeAddress)
      if (Object.keys(poolRewards).length > 0) {
        result[key].poolRewards = poolRewards
      }
    }
    let output = {}
    const dir = `./verify-admin/${release}`
    const outputFileName = `${dir}/output.json`

    if (fs.existsSync(outputFileName)) {
      output = JSON.parse(fs.readFileSync(outputFileName))
      output.networks[chain] = result
    } else {
      fs.mkdirSync(dir, { recursive: true })
      output = {
        version: release,
        networks: {
          [chain]: result,
        },
      }
    }
    fs.writeFileSync(outputFileName, JSON.stringify(output, null, 2))
  })

module.exports = {}
