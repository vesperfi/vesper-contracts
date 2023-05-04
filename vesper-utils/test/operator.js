'use strict'

const { unlock } = require('vesper-commons/utils/setup')
const { ethers } = require('hardhat')
const { BigNumber } = ethers

const { expect } = require('chai')

const poolABI = ['function governor() external view returns(address)']

describe('Operator', function () {
  let operator, strategy
  let governor, alice
  const AaveV2Strategy = '0xaB1A2802F0Ba6F958009DE8739250e04BAE67E3b'

  beforeEach(async function () {
    ;[governor, alice] = await ethers.getSigners()
    strategy = await ethers.getContractAt('IStrategyTest', AaveV2Strategy)
    const contractFactory = await ethers.getContractFactory('Operator', governor)
    operator = await contractFactory.deploy()
  })

  context('Manage operators', function () {
    it('should add new operator', async function () {
      const totalOperators = (await operator.operators()).length
      await operator.updateOperator(alice.address)
      expect((await operator.operators()).length).gt(totalOperators)
    })
    it('should remove operator', async function () {
      // Add operator
      await operator.updateOperator(alice.address)
      const totalOperators = (await operator.operators()).length
      // Remove operator
      await operator.updateOperator(alice.address)
      expect((await operator.operators()).length).lt(totalOperators)
    })
  })
  context('Strategy functions', function () {
    beforeEach(async function () {
      const poolAddress = await strategy.pool()
      const pool = await ethers.getContractAt(poolABI, poolAddress)
      const poolGovernor = await unlock(await pool.governor())
      await strategy.connect(poolGovernor).addKeeper(operator.address)
    })

    it('should call approveToken', async function () {
      const data = strategy.interface.encodeFunctionData('approveToken', [0])
      await operator.execute(strategy.address, data)
    })

    it('should call claimAndSwapRewards', async function () {
      const data = strategy.interface.encodeFunctionData('claimAndSwapRewards', [0])
      const returnData = await operator.callStatic.execute(strategy.address, data)
      expect(BigNumber.from(returnData)).gte(0)
      await operator.execute(strategy.address, data)
    })

    it('should revert claimAndSwapRewards', async function () {
      const data = strategy.interface.encodeFunctionData('claimAndSwapRewards', [100])
      const tx = operator.callStatic.execute(strategy.address, data)
      await expect(tx).to.revertedWith('not-enough-amountOut')
    })
  })
})
