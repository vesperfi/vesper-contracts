'use strict'

const { unlock } = require('vesper-commons/utils/setup')
const { ethers } = require('hardhat')

const { expect } = require('chai')

const poolABI = ['function governor() external view returns(address)', 'function addMaintainer(address) external']
const poolAccountantABI = ['function updateDebtRatio(address,uint256) external']

describe('Maintainer', function () {
  let maintainer, poolAccountant
  let governor, alice

  const vaDAIPool = '0x0538C8bAc84E95A9dF8aC10Aad17DbE81b9E36ee'
  const vaDAIPoolAccountant = '0x2337c59180357cE1d771Da2B2dF56A91e7c442c0'
  const CompoundLeverage = '0x01c48862AE9De8306ddE1C29c2c7131E40817B84'

  beforeEach(async function () {
    ;[governor, alice] = await ethers.getSigners()
    poolAccountant = await ethers.getContractAt(poolAccountantABI, vaDAIPoolAccountant)
    const contractFactory = await ethers.getContractFactory('Maintainer', governor)
    maintainer = await contractFactory.deploy()
  })

  context('Manage maintainers', function () {
    it('should add new maintainer', async function () {
      const totalMaintainers = (await maintainer.maintainers()).length
      await maintainer.updateMaintainer(alice.address)
      expect((await maintainer.maintainers()).length).gt(totalMaintainers)
    })

    it('should remove maintainer', async function () {
      // Add maintainer
      await maintainer.updateMaintainer(alice.address)
      const totalMaintainers = (await maintainer.maintainers()).length
      // Remove maintainer
      await maintainer.updateMaintainer(alice.address)
      expect((await maintainer.maintainers()).length).lt(totalMaintainers)
    })
  })

  context('Call maintainer functions', function () {
    beforeEach(async function () {
      const pool = await ethers.getContractAt(poolABI, vaDAIPool)
      const poolGovernor = await unlock(await pool.governor())
      await pool.connect(poolGovernor).addMaintainer(maintainer.address)
    })

    it('should call updateDebtRatio', async function () {
      const data = poolAccountant.interface.encodeFunctionData('updateDebtRatio', [CompoundLeverage, 0])
      await maintainer.execute(poolAccountant.address, data)
    })
  })
})
