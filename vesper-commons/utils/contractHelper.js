'use strict'

const hre = require('hardhat')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const ethers = hre.ethers
const { getChain } = require('./chains')
const chain = getChain()

async function executeIfExist(fn, param) {
  if (typeof fn === 'function') {
    if (param) {
      await fn(param)
    } else {
      await fn()
    }
  }
}

async function getIfExist(fn, param) {
  if (typeof fn === 'function') {
    if (param) {
      return fn(param)
    }
    return fn()
  }
  return Promise.resolve()
}

/**
 *
 * @param {string} _address - address to be unlocked
 * @returns {object} - Unlocked Signer object
 */
async function unlock(_address) {
  await helpers.impersonateAccount(_address)
  await helpers.setBalance(_address, ethers.utils.parseEther('1'))
  return ethers.getSigner(_address)
}

/**
 * Deploy contract
 *
 * @param {string} name Name of contract
 * @param {any[]} [params] Constructor params
 * @returns {object} Contract instance
 */
async function deployContract(name, params = []) {
  let contractName
  try {
    // Try to read artifact, if success then 'name' is valid input for deploy.
    await hre.artifacts.readArtifact(name)
    contractName = name
  } catch (error) {
    // Error will be thrown if more than 1 artifacts exist with same name.
    // Get all artifact paths. '_getArtifactPathNoError' is custom method
    const artifactPaths = await hre.artifacts._getArtifactPathNoError(name)
    // Get path which has chain and given 'name' in path
    let artifactPath = artifactPaths.filter(path => path.includes(chain))[0]
    // If not such path exist then use the first path from all paths
    if (!artifactPath) {
      artifactPath = artifactPaths[0]
    }
    contractName = artifactPath
  }
  const contractFactory = await ethers.getContractFactory(contractName)
  return contractFactory.deploy(...params)
}

module.exports = {
  deployContract,
  unlock,
  executeIfExist,
  getIfExist,
}
