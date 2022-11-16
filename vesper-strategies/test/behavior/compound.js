'use strict'

const { expect } = require('chai')
const { getStrategyToken } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const hre = require('hardhat')
const { ethers } = hre
const { BigNumber } = require('ethers')
const address = require('vesper-commons/config/mainnet/address')
const { getChain } = require('vesper-commons/utils/chains')

// Compound strategy specific tests
function shouldBehaveLikeCompoundStrategy(strategyIndex) {
  let strategy, user1, pool, collateralToken, token, comp, comptroller, collateralDecimal

  function convertFrom18(amount) {
    const divisor = ethers.utils.parseEther('1').div('10').pow(collateralDecimal)
    return BigNumber.from(amount).div(divisor)
  }

  describe('CompoundStrategy specific tests', function () {
    beforeEach(async function () {
      ;[user1] = this.users
      pool = this.pool
      strategy = this.strategies[strategyIndex].instance
      collateralToken = this.collateralToken
      collateralDecimal = await this.collateralToken.decimals()
      token = await getStrategyToken(this.strategies[strategyIndex])
      comp = await ethers.getContractAt('ERC20', await strategy.rewardToken())
      comptroller = await ethers.getContractAt('Comptroller', await strategy.COMPTROLLER())
    })

    it('Should claim COMP when rebalance is called', async function () {
      if (getChain() === 'mainnet' && (await comptroller.compSupplySpeeds(token.address)).gt(0)) {
        await deposit(pool, collateralToken, 1, user1)
        await strategy.rebalance()
        await token.exchangeRateCurrent()
        await helpers.mine(100)
        const withdrawAmount = await pool.balanceOf(user1.address)
        // compAccrued is updated only when user do some activity. withdraw to trigger compAccrue update
        await pool.connect(user1).withdraw(withdrawAmount)
        const compAccruedBefore = await comptroller.compAccrued(strategy.address)
        await strategy.rebalance()
        const compAccruedAfter = await comptroller.compAccrued(strategy.address)
        expect(compAccruedBefore).to.be.gt(0, 'comp accrued should be > 0 before rebalance')
        expect(compAccruedAfter).to.be.equal(0, 'comp accrued should be 0 after rebalance')
      }
    })

    it('Should liquidate COMP when claimed by external source', async function () {
      if (getChain() === 'mainnet') {
        await deposit(pool, collateralToken, 1, user1)
        await strategy.rebalance()
        const balance = ethers.utils.parseEther('10')
        await adjustBalance(comp.address, strategy.address, balance)
        const afterSwap = await comp.balanceOf(strategy.address)
        expect(afterSwap).to.be.gt(0, 'COMP balance should increase on strategy address')
        await helpers.mine(100)
        await token.exchangeRateCurrent()
        await strategy.rebalance()
        const compBalance = await comp.balanceOf(strategy.address)
        expect(compBalance).to.be.equal('0', 'COMP balance should be 0 on rebalance')
      }
    })

    it('Should be able to withdraw amount when low liquidity for cETH', async function () {
      if (
        getChain() === 'mainnet' &&
        (token.address === address.Compound.cETH ||
          token.address === address.Inverse.anETH ||
          token.address === address.Drops.dETH)
      ) {
        const cToken = await ethers.getContractAt('CToken', token.address)
        await deposit(pool, collateralToken, 2000, user1)
        const wethBalanceBeforeWithdraw = await collateralToken.balanceOf(user1.address)
        const withdrawAmount = await pool.balanceOf(user1.address)
        await strategy.rebalance()
        const bufferInPool = await pool.tokensHere()
        const liquidityAmountInCompound = BigNumber.from(30000000000000)
        await hre.network.provider.send('hardhat_setBalance', [cToken.address, liquidityAmountInCompound.toHexString()])
        expect(await cToken.getCash()).to.be.equals(liquidityAmountInCompound)

        await pool.connect(user1).withdraw(withdrawAmount)
        const wethBalanceAfterWithdraw = await collateralToken.balanceOf(user1.address)
        expect(wethBalanceAfterWithdraw.sub(wethBalanceBeforeWithdraw)).to.be.equal(
          bufferInPool.add(liquidityAmountInCompound),
          'incorrect amount withdraw on low liquidity for cETH',
        )
      }
    })

    it('Should be able to withdraw amount when low liquidity for ERC20 cToken', async function () {
      if (
        getChain() === 'mainnet' &&
        collateralToken.address !== address.WETH &&
        (token.address === address.Compound.cETH ||
          token.address === address.Inverse.anETH ||
          token.address === address.Drops.dETH)
      ) {
        const cToken = await ethers.getContractAt('CToken', token.address)
        const balance = ethers.utils.parseEther('10')
        adjustBalance(collateralToken.address, user1.address, balance)
        await collateralToken.connect(user1).approve(pool.address, balance)
        // deposit half of swapped amount in pool.
        await pool.connect(user1).deposit(balance.div(2))

        const tokenBalanceBeforeWithdraw = await collateralToken.balanceOf(user1.address)
        const withdrawAmount = await pool.balanceOf(user1.address)
        await strategy.rebalance()
        const bufferInPool = await pool.tokensHere()

        const amount = 30000000000000
        const liquidityAmountInCompound = convertFrom18(amount)
        adjustBalance(collateralToken.address, cToken.address, liquidityAmountInCompound)
        expect(await cToken.getCash()).to.be.equals(liquidityAmountInCompound)

        await pool.connect(user1).withdraw(withdrawAmount)
        const tokenBalanceAfterWithdraw = await collateralToken.balanceOf(user1.address)

        expect(tokenBalanceAfterWithdraw.sub(tokenBalanceBeforeWithdraw)).to.be.equal(
          bufferInPool.add(liquidityAmountInCompound),
          'incorrect amount withdraw on low liquidity for ERC20 cToken',
        )
      }
    })
  })
}

module.exports = { shouldBehaveLikeCompoundStrategy }
