'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getStrategyToken, unlock } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')
const { mine, time } = require('@nomicfoundation/hardhat-network-helpers')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { shouldTestCompoundRewards } = require('./compound-rewards')
const { getChain } = require('vesper-commons/utils/chains')
const Address = require('vesper-commons/utils/chains').getChainData().address

async function simulateVesperPoolProfit(strategy) {
  const vPool = await ethers.getContractAt('IVesperPool', await strategy.instance.vPool())
  const collateralTokenAddress = await vPool.token()
  const collateralToken = await ethers.getContractAt('IERC20Metadata', collateralTokenAddress)
  const collateralDecimal = await collateralToken.decimals()
  const poolBalance = await collateralToken.balanceOf(vPool.address)
  await adjustBalance(
    collateralTokenAddress,
    vPool.address,
    poolBalance.add(ethers.utils.parseUnits('5', collateralDecimal)),
  )
}

// Rebalance this strategy and underlying Pool also.
async function rebalance(strategy) {
  const keeper = (await strategy.keepers())[0]
  const keeperSigner = await unlock(keeper)
  await strategy.connect(keeperSigner).rebalance()
  const vPool = await ethers.getContractAt('VPool', await strategy.vPool())
  const strategyAddresses = await vPool.getStrategies()
  let authorized
  for (const strategyAddress of strategyAddresses) {
    const instance = await ethers.getContractAt('IStrategy', strategyAddress)
    const keepers = await instance.keepers()
    authorized = keepers[0] || (await vPool.governor())
    const signer = await unlock(authorized)
    await instance.connect(signer).rebalance()
  }
  await strategy.connect(keeperSigner).rebalance()
}

// Vesper Compound XY strategy specific tests
function shouldBehaveLikeCompoundVesperXyStrategy(index) {
  let strategy, pool, collateralToken, supplyCToken, comptroller, oracle
  let borrowCToken, borrowTokenPrice, supplyTokenPrice
  let user1, user2
  const DECIMAL18 = ethers.utils.parseUnits('1', 18)

  async function assertCurrentBorrow() {
    const borrowed = await borrowCToken.borrowBalanceStored(strategy.address)
    borrowTokenPrice = await oracle.getUnderlyingPrice(borrowCToken.address)
    supplyTokenPrice = await oracle.getUnderlyingPrice(supplyCToken.address)
    const collateralSupplied = (await supplyCToken.balanceOf(strategy.address))
      .mul(await supplyCToken.exchangeRateStored())
      .div(DECIMAL18)
    const cf = (await comptroller.markets(supplyCToken.address)).collateralFactorMantissa
    const maxBorrowPossible = collateralSupplied.mul(cf).div(DECIMAL18).mul(supplyTokenPrice).div(borrowTokenPrice)
    const borrowUpperBound = maxBorrowPossible.mul(await strategy.maxBorrowLimit()).div(10000)
    const borrowLowerBound = maxBorrowPossible.mul(await strategy.minBorrowLimit()).div(10000)
    expect(borrowed).to.be.lt(borrowUpperBound, 'Borrow more than max limit')
    try {
      // In general borrowed will either be close to lower bound or between lower bound and upper bound.
      expect(borrowed).to.be.closeTo(
        borrowLowerBound,
        borrowLowerBound.div(100),
        'borrowed is too much deviated from minBorrowLimit',
      )
    } catch (e) {
      expect(borrowed, 'borrowed should be > lower bound').to.gte(borrowLowerBound)
    }
  }

  // Compound rewards test
  shouldTestCompoundRewards(index)

  describe('CompoundVesperXyStrategy specific tests', function () {
    beforeEach(async function () {
      ;[, user1, user2] = this.users
      pool = this.pool
      strategy = this.strategies[index].instance
      collateralToken = this.collateralToken
      supplyCToken = await getStrategyToken(this.strategies[index])
      borrowCToken = await ethers.getContractAt('CToken', await strategy.borrowCToken())
      const comptrollerAddress = await strategy.comptroller()
      comptroller = await ethers.getContractAt('Comptroller', comptrollerAddress)
      const oracleAddress = await comptroller.oracle()
      oracle = await ethers.getContractAt('Oracle', oracleAddress)
    })

    it('Validate that vPool is reserved token', async function () {
      const isReserved = await strategy.isReservedToken(await strategy.vPool())
      expect(isReserved).to.be.eq(true, 'VPool should be reserved token')
    })

    it('Should borrow tokens at rebalance', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.rebalance()
      const cTokenBalance = await supplyCToken.balanceOf(strategy.address)
      const borrow = await strategy.borrowBalance()
      const currentBorrow = await borrowCToken.callStatic.borrowBalanceCurrent(strategy.address)
      expect(cTokenBalance).to.be.gt('0', 'Supply CToken balance should be > 0')
      expect(borrow).to.be.gt('0', 'Borrow token balance should be > 0')
      expect(currentBorrow).to.be.gte(borrow, 'Current borrow should be >= borrow balance')
    })

    it('Should borrow within defined limits', async function () {
      await deposit(pool, collateralToken, 10, user2)
      await strategy.rebalance()
      await mine(100)
      await supplyCToken.exchangeRateCurrent()
      await borrowCToken.exchangeRateCurrent()
      await strategy.rebalance()
      await assertCurrentBorrow()
    })

    it('Should adjust borrow to keep it within defined limits', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.rebalance()
      await mine(100)

      await supplyCToken.exchangeRateCurrent()
      await borrowCToken.exchangeRateCurrent()
      const borrowBefore = await strategy.borrowBalance()

      const withdrawAmount = (await pool.balanceOf(user1.address)).div('2')
      await pool.connect(user1).withdraw(withdrawAmount)
      await supplyCToken.exchangeRateCurrent()
      await borrowCToken.exchangeRateCurrent()
      const borrowAfter = await strategy.borrowBalance()
      await assertCurrentBorrow()
      expect(borrowAfter).to.be.lt(borrowBefore, 'Borrow amount after withdraw should be less')
    })

    it('Should repayAll and reset minBorrowLimit via governor', async function () {
      await deposit(pool, collateralToken, 50, user2)
      await strategy.rebalance()
      let borrowDebtBalance = await borrowCToken.callStatic.borrowBalanceCurrent(strategy.address)
      expect(borrowDebtBalance).to.be.gt(0, 'Borrow debt should be > 0')

      await strategy.repayAll()

      borrowDebtBalance = await await borrowCToken.callStatic.borrowBalanceCurrent(strategy.address)
      expect(borrowDebtBalance).to.be.eq(0, 'Borrow debt should be = 0')
      const newMinBorrowLimit = await strategy.minBorrowLimit()
      expect(newMinBorrowLimit).to.be.eq(0, 'minBorrowRatio should be 0')
    })

    it('Should update borrow limit', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.rebalance()
      await mine(100)
      await strategy.updateBorrowLimit(5000, 6000)
      const newMinBorrowLimit = await strategy.minBorrowLimit()
      await strategy.rebalance()
      await supplyCToken.exchangeRateCurrent()
      await borrowCToken.exchangeRateCurrent()
      await assertCurrentBorrow()
      expect(newMinBorrowLimit).to.be.eq(5000, 'Min borrow limit is wrong')

      let tx = strategy.updateBorrowLimit(5000, ethers.constants.MaxUint256)
      await expect(tx).to.be.revertedWith('invalid-max-borrow-limit')

      tx = strategy.updateBorrowLimit(5500, 5000)
      await expect(tx).to.be.revertedWith('max-should-be-higher-than-min')
    })

    it('Should repay borrow if borrow limit set to 0', async function () {
      await deposit(pool, collateralToken, 100, user1)
      await strategy.rebalance()
      const borrowDebtBefore = await borrowCToken.callStatic.borrowBalanceCurrent(strategy.address)
      expect(borrowDebtBefore).to.be.gt(0, 'Borrow amount should be > 0')
      await strategy.updateBorrowLimit(0, 0)
      await strategy.rebalance()
      const borrowDebtAfter = await borrowCToken.callStatic.borrowBalanceCurrent(strategy.address)
      expect(borrowDebtAfter).to.be.eq(0, 'Borrow amount should be = 0')
    })

    it('Underlying vPool should make profits and increase Y balance', async function () {
      await deposit(pool, collateralToken, 10, user1)
      await strategy.rebalance()
      const borrowBefore = await strategy.borrowBalance()
      await simulateVesperPoolProfit(this.strategies[index])
      expect(await strategy.borrowBalance()).to.be.gt(borrowBefore)
      const data = await strategy.callStatic.rebalance()
      expect(data._profit, 'Profit should be > 0').to.gt(0)
    })

    if (getChain() == 'mainnet' || getChain() == 'avalanche') {
      it('Should claim and swap VSP for collateral', async function () {
        const vsp = await ethers.getContractAt('ERC20', Address.Vesper.VSP, user2)
        // given
        await deposit(pool, collateralToken, 100, user2)
        await strategy.rebalance()

        // Time travel to earn some VSP
        await time.increase(time.duration.days(5))

        // when claim and swap rewards
        const amountOut = await strategy.callStatic.claimAndSwapRewards(1)
        await strategy.claimAndSwapRewards(amountOut)

        // Verify no VSP left in strategy
        expect(await vsp.balanceOf(strategy.address)).eq(0)
      })
    }

    context('Calculate APY', function () {
      // Not doing any assert. This block is only for pool token price and apy display purpose.
      // eslint-disable-next-line mocha/no-skipped-tests
      xit('Should calculate APY', async function () {
        await deposit(pool, collateralToken, 10, user1)
        let pricePerShare = await pool.pricePerShare()
        /* eslint-disable no-console */
        console.log('PricePerShare before rebalance', pricePerShare)
        await rebalance(strategy)
        pricePerShare = await pool.pricePerShare()
        console.log('PricePerShare after rebalance', pricePerShare)
        await mine(100)
        await rebalance(strategy)
        pricePerShare = await pool.pricePerShare()
        console.log('PricePerShare after 100 blocks and rebalance', pricePerShare)
        await mine(100)
        await rebalance(strategy)
        pricePerShare = await pool.pricePerShare()
        console.log('PricePerShare after 200 blocks and rebalance', pricePerShare)
      })
    })
  })
}
module.exports = { shouldBehaveLikeCompoundVesperXyStrategy }
