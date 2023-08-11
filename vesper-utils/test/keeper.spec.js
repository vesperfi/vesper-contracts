'use strict'

const { unlock } = require('vesper-commons/utils/setup')
const { ethers } = require('hardhat')
const { BigNumber } = ethers

const { expect } = require('chai')

const poolABI = ['function governor() external view returns(address)']

describe('Keeper', function () {
  let keeper, strategy
  let governor, alice
  const AaveV2Strategy = '0xaB1A2802F0Ba6F958009DE8739250e04BAE67E3b'

  beforeEach(async function () {
    ;[governor, alice] = await ethers.getSigners()
    strategy = await ethers.getContractAt('IStrategyTest', AaveV2Strategy)
    const contractFactory = await ethers.getContractFactory('Keeper', governor)
    keeper = await contractFactory.deploy()
  })

  context('Manage keepers', function () {
    it('should add new keeper', async function () {
      const totalKeepers = (await keeper.keepers()).length
      await keeper.updateKeeper(alice.address)
      expect((await keeper.keepers()).length).gt(totalKeepers)
    })
    it('should remove keeper', async function () {
      // Add keeper
      await keeper.updateKeeper(alice.address)
      const totalKeepers = (await keeper.keepers()).length
      // Remove keeper
      await keeper.updateKeeper(alice.address)
      expect((await keeper.keepers()).length).lt(totalKeepers)
    })
  })
  context('Call keeper functions', function () {
    beforeEach(async function () {
      const poolAddress = await strategy.pool()
      const pool = await ethers.getContractAt(poolABI, poolAddress)
      const poolGovernor = await unlock(await pool.governor())
      await strategy.connect(poolGovernor).addKeeper(keeper.address)
    })

    it('should call approveToken', async function () {
      const data = strategy.interface.encodeFunctionData('approveToken', [0])
      await keeper.execute(strategy.address, data)
    })

    it('should call claimAndSwapRewards', async function () {
      const data = strategy.interface.encodeFunctionData('claimAndSwapRewards', [0])
      const returnData = await keeper.callStatic.execute(strategy.address, data)
      expect(BigNumber.from(returnData)).gte(0)
      await keeper.execute(strategy.address, data)
    })

    it('should revert claimAndSwapRewards', async function () {
      const data = strategy.interface.encodeFunctionData('claimAndSwapRewards', [100])
      const tx = keeper.callStatic.execute(strategy.address, data)
      await expect(tx).to.revertedWith('not-enough-amountOut')
    })
  })
})
