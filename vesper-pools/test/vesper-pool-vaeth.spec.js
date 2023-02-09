'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { deployContract } = require('vesper-commons/utils/setup')
const { getChainData } = require('vesper-commons/utils/chains')
const { shouldBehaveLikePool } = require('./vesper-pool-behavior')
const { poolConfig } = getChainData()

describe('vaETH pool basic tests', function () {
  // Run core tests
  shouldBehaveLikePool(poolConfig.VAETH)

  let pool, collateralToken, accountant
  let user1, user2
  describe('ETH as collateral', function () {
    beforeEach(async function () {
      ;[, user1, user2] = await ethers.getSigners()
      pool = await deployContract(poolConfig.VAETH.contractName, poolConfig.VAETH.poolParams)
      accountant = await deployContract('PoolAccountant')
      await accountant.init(pool.address)
      await pool.initialize(...poolConfig.VAETH.poolParams, accountant.address)
      collateralToken = await ethers.getContractAt('ERC20', await pool.token())
    })
    it('Should deposit ETH in pool', async function () {
      // If there is address conflict then it will be non zero. Subtract it from TVL
      const balanceBefore = await collateralToken.balanceOf(pool.address)
      const pricePerShareBefore = await pool.pricePerShare()
      // deposit ETH in pool
      const depositAmount = ethers.utils.parseEther('1')
      await pool.connect(user1)['deposit()']({ value: depositAmount })
      const expectedShares = depositAmount.mul(ethers.utils.parseEther('1')).div(pricePerShareBefore)

      const totalValue = (await pool.totalValue()).sub(balanceBefore)
      const vPoolBalance = await pool.balanceOf(user1.address)

      expect(await pool.totalSupply()).eq(vPoolBalance)
      expect(vPoolBalance).eq(expectedShares)

      // There is possibility that result is off by few wei
      expect(totalValue).to.closeTo(depositAmount, 5)
    })
    it('Should withdraw all ETH', async function () {
      // deposit ETH in pool
      const depositAmount = ethers.utils.parseEther('2')
      await pool.connect(user2)['deposit()']({ value: depositAmount })

      const withdrawAmount = await pool.balanceOf(user2.address)
      const pricePerShare = await pool.pricePerShare()
      const expectedCollateral = withdrawAmount.mul(pricePerShare).div(ethers.utils.parseEther('1'))
      // withdraw ETH
      const tx = pool.connect(user2).withdrawETH(withdrawAmount)

      await expect(tx).changeEtherBalance(user2.address, expectedCollateral)
      expect(await pool.totalDebt()).eq(0)
      expect(await pool.totalSupply()).eq(0)
      expect(await pool.totalValue()).eq(0)
      expect(await pool.balanceOf(user2.address)).eq(0)
    })
  })
})
