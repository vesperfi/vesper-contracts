'use strict'

const { getEvent } = require('vesper-commons/utils/setup')
const { unlock } = require('vesper-commons/utils/contractHelper')
const {
  deposit: _deposit,
  rebalance,
  rebalanceStrategy,
  totalDebtOfAllStrategy,
  makeStrategyProfitable,
  increaseTimeIfNeeded,
} = require('vesper-commons/utils/poolOps')
const chaiAlmost = require('chai-almost')
const chai = require('chai')
chai.use(chaiAlmost(1))
const expect = chai.expect
const { BigNumber } = require('ethers')
const { ethers } = require('hardhat')
const { mine, time } = require('@nomicfoundation/hardhat-network-helpers')

const MAX_BPS = BigNumber.from('10000')

async function shouldBehaveLikePool(poolName, collateralName) {
  let pool, strategies, collateralToken, collateralDecimal, accountant
  let user1, user2, user3, user4

  async function deposit(amount, depositor) {
    return _deposit(pool, collateralToken, amount, depositor)
  }

  function convertFrom18(amount) {
    const decimalConversationFactor = ethers.utils.parseUnits('1', 18 - collateralDecimal)
    return amount.div(decimalConversationFactor)
  }

  describe(`${poolName} basic operation tests`, function () {
    beforeEach(async function () {
      ;[, user1, user2, user3, user4] = this.users
      // This setup helps in not typing 'this' all the time
      pool = this.pool
      accountant = this.accountant
      strategies = this.strategies
      collateralToken = this.collateralToken
      // Decimal will be used for amount conversion
      collateralDecimal = await this.collateralToken.decimals()
    })

    describe(`Deposit ${collateralName} into the ${poolName}`, function () {
      it(`Should deposit ${collateralName} and call rebalance() of each strategy`, async function () {
        const depositAmount = await deposit(50, user4)
        const totalValue = await pool.totalValue()
        for (const strategy of strategies) {
          await rebalanceStrategy(strategy)
        }
        const totalDebtOfStrategies = await totalDebtOfAllStrategy(strategies, pool)
        const totalDebt = await pool.totalDebt()
        const totalSupply = convertFrom18(await pool.totalSupply())
        const vPoolBalance = convertFrom18(await pool.balanceOf(user4.address))
        // Due to deposit fee, issued shares will be less than deposit amount, even if PPS is 1
        expect(vPoolBalance).to.be.lte(depositAmount, `${poolName} balance of user is wrong`)
        expect(totalDebtOfStrategies).to.be.equal(totalDebt, `${collateralName} totalDebt of strategies is wrong`)
        expect(totalSupply).to.be.equal(vPoolBalance, `Total supply of ${poolName} is wrong`)
        // There is possibility that result is off by few wei
        expect(totalValue, `Total value of ${poolName} is wrong`).to.closeTo(depositAmount, 5)
      })
    })

    describe(`Withdraw ${collateralName} from ${poolName}`, function () {
      let depositAmount
      beforeEach(async function () {
        depositAmount = await deposit(50, user1)
      })

      it(`Should withdraw very small ${collateralName} after rebalance`, async function () {
        await rebalance(strategies)
        const collateralBalanceBefore = await collateralToken.balanceOf(user1.address)
        await increaseTimeIfNeeded(strategies[0])
        const withdrawAmount = '10000000000000000'
        await pool.connect(user1).withdraw(withdrawAmount)
        const collateralBalance = await collateralToken.balanceOf(user1.address)
        const totalDebt = await pool.totalDebt()
        const totalDebtOfStrategies = await totalDebtOfAllStrategy(strategies, pool)
        expect(totalDebtOfStrategies).to.be.equal(totalDebt, `${collateralName} totalDebt of strategies is wrong`)
        expect(collateralBalance).to.be.gt(collateralBalanceBefore, 'Withdraw failed')
      })

      it(`Should withdraw partial ${collateralName} after rebalance`, async function () {
        await rebalance(strategies)
        const collateralBalanceBefore = await collateralToken.balanceOf(user1.address)
        await increaseTimeIfNeeded(strategies[0])
        const withdrawAmount = (await pool.balanceOf(user1.address)).div(2)
        const expectedCollateral = withdrawAmount.mul(await pool.pricePerShare()).div(ethers.utils.parseEther('1'))
        await pool.connect(user1).withdraw(withdrawAmount)
        const totalDebt = await pool.totalDebt()
        const totalDebtOfStrategies = await totalDebtOfAllStrategy(strategies, pool)
        expect(totalDebtOfStrategies).to.be.equal(totalDebt, `${collateralName} totalDebt of strategies is wrong`)
        const collateralWithdrawn = (await collateralToken.balanceOf(user1.address)).sub(collateralBalanceBefore)
        // Collateral balance should be expected +-10%
        expect(collateralWithdrawn).closeTo(expectedCollateral, expectedCollateral.div(10), 'Withdraw failed')
      })

      it(`Should withdraw all ${collateralName} after rebalance`, async function () {
        // reset universal fee to 0.
        await pool.updateUniversalFee('0')
        await deposit(15, user1)
        depositAmount = await deposit(15, user2)
        await rebalance(strategies)
        await makeStrategyProfitable(strategies[0].instance, collateralToken)
        await rebalance(strategies)
        const user2Balance = await pool.balanceOf(user2.address)
        // Earn pool leaves dust behind sometimes
        const dust = user2Balance.div(1000000) // 0.0001 % dust
        // Increase time to unlock asset from ConvexFroFrax/Sommelier strategies
        await increaseTimeIfNeeded(strategies[0])
        await pool.connect(user2).withdraw(user2Balance)
        return Promise.all([pool.balanceOf(user2.address), collateralToken.balanceOf(user2.address)]).then(function ([
          vPoolBalance,
          collateralBalance,
        ]) {
          expect(vPoolBalance).to.be.closeTo('0', dust, `${poolName} balance of user is wrong`)
          expect(collateralBalance).to.be.gte(depositAmount, `${collateralName} balance of user is wrong`)
        })
      })
    })

    describe(`Rebalance ${poolName} pool`, function () {
      it('Should rebalance multiple times.', async function () {
        // This test uses time.increase and Sommelier price oracle may revert due to time travel.
        if (strategies[0].type.toUpperCase().includes('SOMMELIER')) {
          return
        }
        let depositAmount = await deposit(50, user3)
        await rebalance(strategies)
        const totalDebtRatioBefore = await pool.totalDebtRatio()
        let totalValue = await pool.totalValue()
        let maxDebt = totalValue.mul(totalDebtRatioBefore).div(MAX_BPS)

        // The following will always fail for CRV strategies
        // TODO: Review
        if (!strategies[0].type.toUpperCase().includes('CURVE')) {
          const buffer = totalValue.sub(maxDebt)
          const tokensHere = await pool.tokensHere()
          expect(tokensHere.sub(buffer).toNumber()).to.almost.equal(0, 'Tokens here is not correct')
        }

        // Time travel 6 hours
        await time.increase(6 * 60 * 60)
        await mine(100)
        depositAmount = depositAmount.add(await deposit(10, user3))
        await time.increase(6 * 60 * 60)
        await mine(100)
        await rebalance(strategies)
        await time.increase(6 * 60 * 60)
        await mine(100)
        totalValue = await pool.totalValue()
        const totalDebtRatioAfter = await pool.totalDebtRatio()
        maxDebt = totalValue.mul(totalDebtRatioAfter).div(MAX_BPS)
        // Advance 1 block for proper available credit limit check
        await mine(1)
        let unusedCredit = BigNumber.from('0')
        for (const strategy of strategies) {
          const credit = await pool.availableCreditLimit(strategy.instance.address)
          unusedCredit = unusedCredit.add(credit)
        }
        const totalDebt = await pool.totalDebt()
        const totalSupply = convertFrom18(await pool.totalSupply())
        const vPoolBalance = convertFrom18(await pool.balanceOf(user3.address))

        // FIXME: This is always false when `debtRatio` decreases after rebalance
        if (totalDebtRatioAfter.gte(totalDebtRatioBefore)) {
          expect(maxDebt.sub(unusedCredit).sub(totalDebt).toNumber()).to.almost.eq(
            0,
            `${collateralName} total debt of pool is wrong`,
          )
        }

        if ((await accountant.externalDepositFee()).gt(0)) {
          // If external deposit fee is non zero, shares will be less than deposit amount
          expect(vPoolBalance, `${poolName} balance of user is wrong`).to.be.lte(depositAmount)
        } else {
          // There is possibility that result is off by few wei
          expect(vPoolBalance, `${poolName} balance of user is wrong`).to.closeTo(depositAmount, 25)
        }

        expect(totalSupply, `Total supply of ${poolName} is wrong`).to.be.gte(vPoolBalance)
      })

      it('Should update strategy lastRebalance param', async function () {
        // This test uses time.increase and Sommelier price oracle may revert due to time travel.
        if (strategies[0].type.toUpperCase().includes('SOMMELIER')) {
          return
        }
        // given
        const [strategyToRebalance] = strategies
        const { _lastRebalance: lastRebalanceBefore } = await pool.strategy(strategyToRebalance.instance.address)

        // when
        await time.increase(6 * 60 * 60)
        await mine(100)
        await rebalance([strategyToRebalance])

        // then
        const { _lastRebalance: lastRebalanceAfter } = await pool.strategy(strategyToRebalance.instance.address)
        expect(lastRebalanceAfter).to.gt(lastRebalanceBefore)
      })
    })

    describe(`Price per share of ${poolName} pool`, function () {
      it('Should increase pool value', async function () {
        await deposit(50, user1)
        await rebalance(strategies)
        // some strategies are loss making so lets make strategy profitable by sending token
        await makeStrategyProfitable(strategies[0].instance, collateralToken)
        const value1 = await pool.totalValue()
        // Time travel to generate earning
        await rebalance(strategies)
        const value2 = await pool.totalValue()
        expect(value2).to.be.gt(value1, `${poolName} Pool value should increase`)
      })
    })

    describe(`Universal fee in ${poolName} pool`, function () {
      let secondsPerYear
      let universalFee

      beforeEach(async function () {
        // Set external deposit fee to 0 for curve strategies
        await accountant.updateExternalDepositFee(strategies[0].instance.address, '0')
        await deposit(50, user1)
        secondsPerYear = await pool.ONE_YEAR()
        universalFee = await pool.universalFee()
      })

      it('Should collect universal fee on rebalance', async function () {
        const feeCollector = await unlock(strategies[0].feeCollector)
        const timeBetweenRebalance = 60 * 60
        await rebalanceStrategy(strategies[0])
        // Advance some block will help compound related strategy to earn some profit
        await mine(300)
        // Increase time before doing another rebalance
        await time.increase(timeBetweenRebalance)
        const totalDebt = await accountant.totalDebtOf(strategies[0].instance.address)
        await makeStrategyProfitable(strategies[0].instance, collateralToken)
        const tx = await rebalanceStrategy(strategies[0])
        const profit = (await getEvent(tx, accountant, 'EarningReported')).profit
        let fee = universalFee.mul(timeBetweenRebalance).mul(totalDebt).div(secondsPerYear).div(MAX_BPS)
        const maxFee = profit.mul(await pool.maxProfitAsFee()).div(MAX_BPS)
        if (fee.gt(maxFee)) {
          fee = maxFee
        }
        const vPoolBalance = await pool.balanceOf(feeCollector.address)
        expect(vPoolBalance, 'Fee earned by FC should be > 0').to.gt(0)
        await pool.connect(feeCollector).withdraw(vPoolBalance)
        expect(await pool.balanceOf(feeCollector.address), `${poolName} balance of FC should be equal to 0`).to.eq(0)
        const collateralBalance = await collateralToken.balanceOf(feeCollector.address)
        expect(collateralBalance, 'Incorrect fee collected').to.gte(fee)
      })

      it('Should collect universal fee equal to maxProfitAsFee', async function () {
        const strategySigner = await unlock(strategies[0].instance.address)
        // Manual and force report earning to get fund from pool
        await pool.connect(strategySigner).reportEarning(0, 0, 0)
        // Increase time
        await time.increase(60 * 60)
        // set universal fee super high.
        await pool.updateUniversalFee('5000')
        // Manual and force report earning with 1000 as profit
        const profit = BigNumber.from(1000) // wei
        // Actual fee calculation on TVL will be higher than profit/2 so final fee will be profit/2
        const expectedFee = profit.mul(await pool.maxProfitAsFee()).div(MAX_BPS)
        const totalDebt = await accountant.totalDebtOf(strategies[0].instance.address)
        // This will trigger fee calculation
        const tx = pool.connect(strategySigner).reportEarning(profit, 0, 0)
        await expect(tx).emit(pool, 'UniversalFeePaid').withArgs(totalDebt, 1000, expectedFee)
        // feeAsShare is in 18 decimals, profit is in collateral decimals
        const expectedFeeAsShare = ethers.utils.parseUnits(expectedFee.toString(), 18 - collateralDecimal)
        const feeCollectorBalance = await pool.balanceOf(strategies[0].feeCollector)
        // There is possibility that result is off by few wei
        expect(feeCollectorBalance, 'Fee earned by FC is wrong').to.closeTo(expectedFeeAsShare, 5)
      })
    })

    describe(`${poolName}: Should report earning correctly`, function () {
      it('Strategy should receive more amount when new deposit happen', async function () {
        await deposit(75, user2)
        await rebalance(strategies)
        const totalDebtBefore = await pool.totalDebtOf(strategies[0].instance.address)
        await deposit(50, user2)
        await rebalance(strategies)
        const totalDebtAfter = await pool.totalDebtOf(strategies[0].instance.address)
        expect(totalDebtAfter).to.be.gt(totalDebtBefore, `Total debt of strategy in ${poolName} is wrong`)
      })

      it('Strategy should not receive new amount if current debt of pool > max debt', async function () {
        await Promise.all([deposit(50, user1), deposit(60, user2)])
        await rebalance(strategies)
        let [totalDebtRatio, totalValue, totalDebtBefore] = await Promise.all([
          pool.totalDebtRatio(),
          pool.totalValue(),
          pool.totalDebt(),
        ])

        let maxTotalDebt = totalValue.mul(totalDebtRatio).div(MAX_BPS)
        expect(Math.abs(maxTotalDebt.sub(totalDebtBefore))).to.almost.equal(
          1,
          `Total debt of ${poolName} is wrong after rebalance`,
        )
        const totalDebtOfStrategies = await totalDebtOfAllStrategy(strategies, pool)
        expect(Math.abs(maxTotalDebt.sub(totalDebtOfStrategies))).to.almost.equal(
          1,
          'Total debt of all strategies is wrong after rebalance',
        )
        await increaseTimeIfNeeded(strategies[0])
        const withdrawAmount = await pool.balanceOf(user1.address)
        await pool.connect(user1).withdraw(withdrawAmount)
        // Withdraw decreases value
        totalValue = await pool.totalValue()
        // Value decreases maxTotalDebt
        maxTotalDebt = totalValue.mul(totalDebtRatio).div(MAX_BPS)
        // Withdraw decreases totalDebt of pool
        let totalDebtAfter = await pool.totalDebt()
        // TotalDebt of pool can be higher or equal than maxTotalDebt until rebalance happen
        expect(totalDebtAfter).to.be.gte(maxTotalDebt, `Total debt of ${poolName} is wrong after withdraw`)
        // TotalDebt after withdraw will be less than it was before
        expect(totalDebtAfter).to.be.lt(totalDebtBefore, `Total debt of ${poolName} is wrong after withdraw`)
        // In case of multiple strategies, most withdraw will happen from first strategy and most of
        // remaining debt is in other strategies hence rebalance other strategies to get fund back
        // and then rebalance first strategy.
        for (let i = 1; i < strategies.length; i++) {
          await strategies[i].instance.rebalance()
        }
        await increaseTimeIfNeeded(strategies[0])
        await strategies[0].instance.rebalance()

        // FIXME: This is always false when `debtRatio` decreases after rebalance
        const totalDebtRatioAfter = await pool.totalDebtRatio()
        if (totalDebtRatioAfter.gte(totalDebtRatio)) {
          // totalDebt of pool after rebalance, it should be close to maxTotalDebt
          totalDebtAfter = await pool.totalDebt()

          let delta = maxTotalDebt.div(10000) // allow 0.01% deviation
          if (delta.eq('0')) {
            delta = '1'
          }

          expect(totalDebtAfter).to.be.closeTo(
            maxTotalDebt,
            delta,
            `Total debt of ${poolName} is wrong after withdraw and rebalance`,
          )
        }
      })

      it('Pool record correct value of profit and loss', async function () {
        await deposit(70, user2)
        await rebalance(strategies)
        await time.increase(60 * 60)
        await mine(100)
        await makeStrategyProfitable(strategies[0].instance, collateralToken)
        await rebalance(strategies)
        const strategyParams = await pool.strategy(strategies[0].instance.address)
        const totalProfit = strategyParams._totalProfit
        expect(totalProfit).to.be.gt(0, `Total debt of strategy in ${poolName} is wrong`)
      })
    })

    describe(`${poolName}: Available credit line`, function () {
      it('Should return 0 credit line when pool is shutdown', async function () {
        await deposit(50, user2)
        await rebalance(strategies)
        await deposit(55, user1)
        let creditLimit = await pool.availableCreditLimit(strategies[0].instance.address)
        expect(creditLimit).to.be.gt(0, `Credit limit of strategy in ${poolName} is wrong`)
        await pool.shutdown()
        creditLimit = await pool.availableCreditLimit(strategies[0].instance.address)
        expect(creditLimit).to.be.eq(0, `Credit limit of strategy in ${poolName} is wrong`)
      })

      it('Should return 0 credit line  when current debt > max debt', async function () {
        // Given user2 deposit before rebalance and deposits more than user 1
        await deposit(150, user2)
        await rebalance(strategies)
        await deposit(100, user1)
        const withdrawAmount = await pool.balanceOf(user2.address)
        // Withdrawing more than what is available in pool will make current debt > max debt
        await pool.connect(user2).withdraw(withdrawAmount)
        const creditLimit = await pool.availableCreditLimit(strategies[0].instance.address)
        // There is possibility that creditLimit is 1 wei or 0 best case
        expect(creditLimit, `Credit limit of strategy in ${poolName} is wrong`).to.lte(1)
      })

      it('Credit line should be > 0 when new deposit receive', async function () {
        await deposit(65, user2)
        await rebalance(strategies)
        await deposit(50, user1)
        const creditLimit = await pool.availableCreditLimit(strategies[0].instance.address)
        expect(creditLimit).to.be.gt(0, `Credit limit of strategy in ${poolName} is wrong`)
      })
    })
  })
}

module.exports = { shouldBehaveLikePool }
