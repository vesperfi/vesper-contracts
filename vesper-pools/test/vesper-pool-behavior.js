'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')

const { adjustBalance } = require('vesper-commons/utils/balance')
const { deposit } = require('vesper-commons/utils/poolOps')
const { deployContract } = require('vesper-commons/utils/setup')
const { getPermitData } = require('vesper-commons/utils/sign')

const MNEMONIC = 'test test test test test test test test test test test junk'

async function shouldBehaveLikePool(poolConfig) {
  let pool, collateralToken, collateralDecimal, accountant
  let user1, user2
  describe('Vesper pool core tests', function () {
    beforeEach(async function () {
      ;[, user1, user2] = await ethers.getSigners()
      pool = await deployContract(poolConfig.contractName, poolConfig.poolParams)

      accountant = await deployContract('PoolAccountant')
      await accountant.init(pool.address)
      await pool.initialize(...poolConfig.poolParams, accountant.address)
      collateralToken = await ethers.getContractAt('ERC20', await pool.token())

      // Decimal will be used for amount conversion
      collateralDecimal = await collateralToken.decimals()
    })

    it('Should allow gasless approval using permit()', async function () {
      const amount = ethers.utils.parseEther('1')
      const { owner, deadline, sign } = await getPermitData(pool, amount, MNEMONIC, user1.address)
      await pool.permit(owner, user1.address, amount, deadline, sign.v, sign.r, sign.s)
      const allowance = await pool.allowance(owner, user1.address)
      expect(allowance).eq(amount)
    })

    it('Should deposit collateral in pool', async function () {
      // If there is address conflict then it will be non zero. Subtract it from TVL
      const balanceBefore = await collateralToken.balanceOf(pool.address)
      const pricePerShareBefore = await pool.pricePerShare()
      const depositAmount = await deposit(pool, collateralToken, 10, user1)
      const expectedShares = depositAmount.mul(ethers.utils.parseEther('1')).div(pricePerShareBefore)

      const totalValue = (await pool.totalValue()).sub(balanceBefore)
      const vPoolBalance = await pool.balanceOf(user1.address)

      expect(await pool.totalSupply()).eq(vPoolBalance)
      expect(vPoolBalance).eq(expectedShares)
      // There is possibility that result is off by few wei
      expect(totalValue).to.closeTo(depositAmount, 5)
    })

    // it('Should deposit collateral in pool when externalDepositFee > 0', async function () {
    //   // TODO update external deposit fee
    //   // If there is address conflict then it will be non zero. Subtract it from TVL
    //   const balanceBefore = await collateralToken.balanceOf(pool.address)
    //   const pricePerShareBefore = await pool.pricePerShare()
    //   const depositAmount = await deposit(pool, collateralToken, 10, user1)

    //   const externalDepositFee = await accountant.externalDepositFee()

    //   const amountAfterFee = depositAmount.sub(depositAmount.mul(externalDepositFee).div('10000'))
    //   const expectedShares = amountAfterFee.mul(ethers.utils.parseEther('1')).div(pricePerShareBefore)
    //   const pricePerShareAfter = await pool.pricePerShare()
    //   expect(pricePerShareAfter).to.gt(pricePerShareBefore, 'Price per share should increase')

    //   const totalSupply = await pool.totalSupply()
    //   const totalValue = (await pool.totalValue()).sub(balanceBefore)
    //   const vPoolBalance = await pool.balanceOf(user1.address)

    //   expect(vPoolBalance).eq(expectedShares)
    //   expect(totalSupply).eq(vPoolBalance)
    //   // There is possibility that result is off by few wei
    //   expect(totalValue).to.closeTo(depositAmount, 5)
    // })

    describe('Withdraw collateral from pool', function () {
      const valueDust = '100000'
      beforeEach(async function () {
        await deposit(pool, collateralToken, 50, user1)
      })

      it('Should withdraw all collateral', async function () {
        const withdrawAmount = await pool.balanceOf(user1.address)
        const pricePerShare = await pool.pricePerShare()
        const expectedCollateral = withdrawAmount.mul(pricePerShare).div(ethers.utils.parseEther('1'))

        await pool.connect(user1).withdraw(withdrawAmount)
        return Promise.all([
          pool.totalDebt(),
          pool.totalSupply(),
          pool.totalValue(),
          pool.balanceOf(user1.address),
          collateralToken.balanceOf(user1.address),
        ]).then(function ([totalDebt, totalSupply, totalValue, vPoolBalance, collateralBalance]) {
          expect(totalDebt).eq(0)
          expect(totalSupply).eq(0)
          expect(vPoolBalance).eq(0)
          // If external deposit fee is non zero, pool may be in net gain which will leave token dust in pool
          expect(totalValue).to.be.lte(valueDust)
          // There is possibility that result is off by few wei
          expect(collateralBalance).to.closeTo(expectedCollateral, 5)
        })
      })

      it('Should withdraw partial collateral', async function () {
        let vPoolBalance = await pool.balanceOf(user1.address)
        const amountToKeep = ethers.utils.parseUnits('100', 18 - collateralDecimal) // 100 Wei
        const withdrawAmount = vPoolBalance.sub(amountToKeep)
        const pricePerShare = await pool.pricePerShare()
        const expectedCollateral = withdrawAmount.mul(pricePerShare).div(ethers.utils.parseEther('1'))
        // Withdraw
        await pool.connect(user1).withdraw(withdrawAmount)
        vPoolBalance = await pool.balanceOf(user1.address)
        const collateralBalance = await collateralToken.balanceOf(user1.address)

        expect(vPoolBalance).eq(amountToKeep)
        // There is possibility that result is off by few wei
        expect(collateralBalance).to.closeTo(expectedCollateral, 5)
      })
    })

    it('Should increase pool share value', async function () {
      await deposit(pool, collateralToken, 50, user1)
      const pps = await pool.pricePerShare()
      const value1 = await pool.totalValue()
      const newAmount = (await pool.tokensHere()).add(ethers.utils.parseUnits('1', collateralDecimal))
      // Add some collateral in pool
      await adjustBalance(collateralToken.address, pool.address, newAmount)
      expect(await pool.totalValue()).gt(value1)
      expect(await pool.pricePerShare()).gt(pps)
    })

    describe('Sweep ERC20 token from Vesper pool', function () {
      it('Should sweep ERC20 for collateral', async function () {
        const token = await (await ethers.getContractFactory('MockToken')).deploy()
        const tokenAmount = ethers.utils.parseEther('10')
        await deposit(pool, collateralToken, 60, user2)
        await token.mint(pool.address, tokenAmount)
        await pool.sweepERC20(token.address)
        const governor = await pool.governor()
        return Promise.all([
          pool.totalSupply(),
          pool.totalValue(),
          token.balanceOf(pool.address),
          token.balanceOf(governor),
        ]).then(function ([totalSupply, totalValue, tokenBalance, tokenBalanceFC]) {
          expect(totalSupply).to.be.gt(0)
          expect(totalValue).to.be.gt(0)
          expect(tokenBalance).to.be.eq(0)
          expect(tokenBalanceFC).to.be.eq(tokenAmount)
        })
      })

      it('Should not be able sweep reserved token', async function () {
        const tx = pool.sweepERC20(collateralToken.address)
        await expect(tx).to.be.revertedWith('8')
      })
    })
  })
}
module.exports = { shouldBehaveLikePool }
