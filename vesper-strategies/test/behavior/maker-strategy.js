'use strict'

const { deposit } = require('vesper-commons/utils/poolOps')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time } = require('@nomicfoundation/hardhat-network-helpers')
const address = require('vesper-commons/config/mainnet/address')
const { executeIfExist, makeNewStrategy, getStrategyToken, unlock } = require('vesper-commons/utils/setup')
const { adjustBalance } = require('vesper-commons/utils/balance')
const Address = require('vesper-commons/utils/chains').getChainData().address
const { BigNumber } = require('ethers')

function shouldBehaveLikeMakerStrategy(index) {
  let pool, strategy, token, accountant
  let collateralToken, collateralDecimal, isUnderwater, cm, vaultNum
  let governor, user1, user2

  async function updateRate() {
    await executeIfExist(token.exchangeRateCurrent)
    // Update rate using Jug drip
    const jugLike = await ethers.getContractAt('JugLike', '0x19c0976f590D67707E62397C87829d896Dc0f1F1')
    const vaultType = await strategy.collateralType()
    await jugLike.drip(vaultType)
  }

  describe('MakerStrategy specific tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      accountant = this.accountant
      strategy = this.strategies[index].instance
      governor = await unlock(await pool.governor())
      collateralToken = this.collateralToken
      token = await getStrategyToken(this.strategies[index])
      isUnderwater = await strategy.isUnderwater()
      cm = await ethers.getContractAt('ICollateralManager', await strategy.cm())
      vaultNum = await strategy.vaultNum()
      // Decimal will be used for amount conversion
      collateralDecimal = await this.collateralToken.decimals()
    })

    it('Verify convertFrom18 is implemented correctly', async function () {
      const expected = ethers.utils.parseUnits('1', collateralDecimal)
      const actual = await strategy.convertFrom18(ethers.utils.parseUnits('1', 18))
      expect(actual).to.be.equal(expected, 'Conversion from 18 is wrong')
    })

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

    describe('Resurface', function () {
      it('Should resurface only when pool is underwater ', async function () {
        if (isUnderwater) {
          await expect(strategy.resurface(ethers.constants.MaxUint256)).to.not.reverted
        }
        await expect(strategy.resurface(ethers.constants.MaxUint256)).to.be.revertedWith('pool-is-above-water')
      })

      it('Should bring the pool above water on resurface', async function () {
        if (isUnderwater) {
          await expect(strategy.resurface(ethers.constants.MaxUint256)).to.not.reverted
          await expect(strategy.isUnderwater()).to.be.true
        }
      })
    })

    describe('Vault transfer', function () {
      let newStrategy, newStrategyAddress
      beforeEach(async function () {
        newStrategy = await makeNewStrategy(this.strategies[index], pool.address, { skipVault: true })
        newStrategyAddress = newStrategy.instance.address
      })
      it('Should not transfer vault ownership using any account.', async function () {
        const tx = cm.connect(user1)['transferVaultOwnership(address)'](newStrategyAddress)
        await expect(tx).to.be.revertedWith("caller-doesn't-own-any-vault")
      })

      it('Should transfer vault ownership on strategy migration', async function () {
        const vaultBeforeMigration = await cm.vaultNum(strategy.address)
        await pool.connect(governor).migrateStrategy(strategy.address, newStrategyAddress)
        const vaultAfterMigration = await cm.vaultNum(newStrategyAddress)
        expect(vaultNum).to.be.equal(vaultBeforeMigration, 'vault number should match for strategy and cm.')
        expect(vaultAfterMigration).to.be.equal(vaultBeforeMigration, 'vault number should be same')

        const vaultWithOldStrategy = await cm.vaultNum(strategy.address)
        expect(vaultWithOldStrategy).to.be.equal(0, 'Old strategy should not own vault.')
      })

      it('Should have new strategy as owner of the vault.', async function () {
        const vaultInfoBefore = await cm.getVaultInfo(strategy.address)
        await pool.connect(governor).migrateStrategy(strategy.address, newStrategyAddress)
        // There is some issue with checking actual error message. So let's just check that call is reverted.
        await expect(cm.getVaultInfo(strategy.address)).to.be.reverted
        const vaultInfoAfter = await cm.getVaultInfo(newStrategyAddress)
        expect(vaultInfoBefore.collateralLocked).to.be.equal(vaultInfoAfter.collateralLocked)
        expect(vaultInfoBefore.daiDebt).to.be.equal(vaultInfoAfter.daiDebt)
        expect(vaultInfoBefore.collateralUsdRate).to.be.equal(vaultInfoAfter.collateralUsdRate)
        expect(vaultInfoBefore.collateralRatio).to.be.equal(vaultInfoAfter.collateralRatio)
        expect(vaultInfoBefore.minimumDebt).to.be.equal(vaultInfoAfter.minimumDebt)
      })
    })

    describe('Deposit scenario', function () {
      it('Should deposit and rebalance', async function () {
        const balanceBefore = await pool.balanceOf(user1.address)
        await deposit(pool, collateralToken, 10, user1)
        await strategy.rebalance()
        const balanceAfter = await pool.balanceOf(user1.address)
        expect(balanceAfter).to.be.gt(balanceBefore, 'pool balance of user is wrong')
      })
    })

    describe('Withdraw scenario', function () {
      it('Should withdraw after rebalance', async function () {
        await deposit(pool, collateralToken, 10, user2)
        await strategy.rebalance()

        const balanceBefore = await collateralToken.balanceOf(user2.address)
        const withdrawAmount = await pool.balanceOf(user2.address)
        await pool.connect(user2).withdraw(withdrawAmount)
        const balanceAfter = await collateralToken.balanceOf(user2.address)
        expect(balanceAfter).to.be.gt(balanceBefore, 'balance of user is wrong')
      })

      it('Should pay back all debt if debt is below dust.', async function () {
        await deposit(pool, collateralToken, 20, user1)
        const withdrawAmount = (await pool.balanceOf(user1.address)).sub('100').toString()
        await strategy.rebalance()

        let vaultInfo = await cm.getVaultInfo(strategy.address)
        expect(vaultInfo.daiDebt).to.be.gt('0', 'Dai debt should be gt zero')
        await executeIfExist(token.exchangeRateCurrent)
        const underwater = await strategy.isUnderwater()
        if (underwater) {
          await strategy.resurface(ethers.constants.MaxUint256)
        }
        await strategy.rebalance()

        await pool.connect(user1).withdraw(withdrawAmount)
        vaultInfo = await cm.getVaultInfo(strategy.address)
        expect(vaultInfo.daiDebt).to.be.equal('0', 'Dai debt should be zero')
      })
    })

    describe('Earning scenario', function () {
      beforeEach(async function () {
        await deposit(pool, collateralToken, 30, user1)
        await strategy.rebalance()
      })

      it('Should report profit when there is DAI earning', async function () {
        await deposit(pool, collateralToken, 40, user2)
        await strategy.rebalance()

        const ppsBefore = await pool.pricePerShare()
        await adjustBalance(address.DAI, strategy.address, ethers.utils.parseUnits('1000', 18))
        const data = await strategy.callStatic.rebalance()
        expect(data._profit).to.be.gt(0, 'Should have some profit')
        expect(data._loss).to.be.equal(0, 'Should have no loss')
        await strategy.rebalance()

        const ppsAfter = await pool.pricePerShare()
        expect(ppsAfter).to.be.gt(ppsBefore, 'Collateral token in pool should increase')
        const tokenBalanceBefore = await token.balanceOf(strategy.address)
        await strategy.rebalance()

        const tokenBalanceAfter = await token.balanceOf(strategy.address)
        expect(tokenBalanceAfter).to.be.gt(tokenBalanceBefore, 'Should increase dai balance in aave maker strategy')
      })

      it('Should borrow more dai when strategy get more fund from pool', async function () {
        await deposit(pool, collateralToken, 50, user2)
        await strategy.rebalance()

        const daiDebtBefore = await cm.getVaultDebt(strategy.address)
        await deposit(pool, collateralToken, 50, user2)
        await updateRate()
        await strategy.rebalance()

        const daiDebtAfter = await cm.getVaultDebt(strategy.address)
        expect(daiDebtAfter).to.be.gt(daiDebtBefore, 'Should increase vault debt on rebalance')
      })

      it('Should payback all when debt ratio set 0', async function () {
        await deposit(pool, collateralToken, 150, user2)
        await strategy.rebalance()

        await accountant.updateDebtRatio(strategy.address, 0)
        const underwater = await strategy.isUnderwater()
        if (underwater) {
          await strategy.resurface(ethers.constants.MaxUint256)
        }
        await strategy.rebalance()

        const daiDebtAfter = await cm.getVaultDebt(strategy.address)
        expect(daiDebtAfter).to.be.eq(0, 'Should have 0 debt')
      })

      it('Should payback when low water', async function () {
        await deposit(pool, collateralToken, 150, user2)
        await strategy.rebalance()

        let highWater = await strategy.highWater()
        const WAT = BigNumber.from('10000000000000000')
        highWater = highWater.div(WAT)
        const lw = highWater.add(BigNumber.from('10'))
        const hw = lw.add(BigNumber.from('10'))
        const daiDebtBefore = await cm.getVaultDebt(strategy.address)
        await strategy.updateBalancingFactor(hw, lw)
        highWater = await strategy.highWater()
        await strategy.rebalance()

        const daiDebtAfter = await cm.getVaultDebt(strategy.address)
        expect(daiDebtAfter).to.be.lt(daiDebtBefore, 'Should decrease vault debt when low water')
      })
    })
  })
}

module.exports = { shouldBehaveLikeMakerStrategy }
