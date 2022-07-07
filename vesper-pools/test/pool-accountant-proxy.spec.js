'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deployContract } = require('vesper-commons/utils/setup')
const { address, poolConfig } = require('vesper-commons/utils/chains').getChainData()
const VAETH = poolConfig.VAETH

const multiCall = address.MultiCall
describe('Pool accountant proxy', function () {
  let pool, strategy, poolAccountant, poolAccountantImpl
  let governor, user1
  let proxyAdmin, proxy

  beforeEach(async function () {
    ;[governor, user1] = await ethers.getSigners()

    pool = await deployContract(VAETH.contractName, VAETH.poolParams)

    // Deploy pool accountant implementation
    poolAccountantImpl = await deployContract('PoolAccountant', [])
    // Deploy proxy admin
    proxyAdmin = await deployContract('ProxyAdmin', [])
    const initData = poolAccountantImpl.interface.encodeFunctionData('init', [pool.address])
    // Deploy proxy with logic implementation
    proxy = await deployContract('TransparentUpgradeableProxy', [
      poolAccountantImpl.address,
      proxyAdmin.address,
      initData,
    ])
    // Get implementation from proxy
    poolAccountant = await ethers.getContractAt('PoolAccountant', proxy.address)

    strategy = ethers.utils.getContractAddress({ from: user1.address, nonce: 99 })
    await poolAccountant.connect(governor).addStrategy(strategy, 9000, 0)
  })

  describe('Update proxy implementation', function () {
    let proxyAddress

    beforeEach(async function () {
      // Deploy new implementation
      poolAccountantImpl = await deployContract('PoolAccountant', [])
      proxyAddress = poolAccountant.address
    })

    it('Should upgrade in proxy directly', async function () {
      const strategiesBefore = await poolAccountant.getStrategies()

      // Upgrade proxy to point to new implementation
      await proxyAdmin.connect(governor).upgrade(proxy.address, poolAccountantImpl.address)
      poolAccountant = await ethers.getContractAt('PoolAccountant', proxy.address)

      expect(poolAccountant.address === proxyAddress, 'Pool accountant proxy address should be same').to.be.true
      const strategiesAfter = await poolAccountant.getStrategies()
      expect(strategiesAfter[0]).to.be.eq(
        strategiesBefore[0],
        'Strategies after proxy upgrade should be same as before',
      )
    })

    describe('Upgrader', function () {
      let upgrader

      beforeEach(async function () {
        // Deploy upgrader
        upgrader = await deployContract('PoolAccountantUpgrader', [multiCall])

        // Transfer proxy ownership to the upgrader
        await proxyAdmin.connect(governor).changeProxyAdmin(proxy.address, upgrader.address)
      })

      it('Should upgrade in proxy via upgrader', async function () {
        // Trigger upgrade
        await upgrader.connect(governor).safeUpgrade(proxy.address, poolAccountantImpl.address)

        poolAccountant = await ethers.getContractAt('PoolAccountant', proxy.address)
        expect(poolAccountant.address === proxyAddress, 'Pool accountant proxy address should be same').to.be.true
      })

      it('Should properly revert wrong upgrades via upgrader', async function () {
        // Trigger upgrade
        await expect(upgrader.connect(governor).safeUpgrade(proxy.address, multiCall)).to.be.reverted
      })
    })
  })
})
