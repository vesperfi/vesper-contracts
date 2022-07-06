'use strict'

const { deposit } = require('../utils/poolOps')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { BigNumber: BN } = require('ethers')
const { executeIfExist, deployContract, makeNewStrategy, getStrategyToken, unlock } = require('../utils/setup')
const DECIMAL18 = ethers.utils.parseUnits('1', 18)

function shouldValidateMakerCommonBehavior(index) {
  let pool, strategy, token
  let collateralToken, collateralDecimal, isUnderwater, cm, vaultNum, swapManager
  let governor, user1, user2

  describe('MakerStrategy specific tests', function () {
    beforeEach(async function () {
      ;[governor, user1, user2] = this.users
      pool = this.pool
      pool = this.pool
      strategy = this.strategies[index].instance
      governor = await unlock(await pool.governor())
      collateralToken = this.collateralToken
      token = await getStrategyToken(this.strategies[index])
      isUnderwater = await strategy.isUnderwater()
      cm = await ethers.getContractAt('ICollateralManager', await strategy.cm())
      vaultNum = await strategy.vaultNum()
      // Decimal will be used for amount conversion
      collateralDecimal = await this.collateralToken.decimals()
      swapManager = this.swapManager
    })

    it('Verify convertFrom18 is implemented correctly', async function () {
      const expected = ethers.utils.parseUnits('1', collateralDecimal)
      const actual = await strategy.convertFrom18(DECIMAL18)
      expect(actual).to.be.equal(expected, 'Conversion from 18 is wrong')
    })

    describe('Resurface', function () {
      it('Should resurface only when pool is underwater ', async function () {
        if (isUnderwater) {
          await expect(strategy.resurface()).to.not.reverted
        }
        await expect(strategy.resurface()).to.be.revertedWith('pool-is-above-water')
      })

      it('Should bring the pool above water on resurface', async function () {
        if (isUnderwater) {
          await expect(strategy.resurface()).to.not.reverted
          await expect(strategy.isUnderwater()).to.be.true
        }
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

      // eslint-disable-next-line mocha/no-skipped-tests
      it.skip('Should revert if collateral type is not the same', async function () {
        // given
        strategy = await deployContract('AaveMakerStrategyETH_A', [pool.address, cm.address, swapManager.address])
        newStrategy = await deployContract('AaveMakerStrategyETH_C', [pool.address, cm.address, swapManager.address])
        expect(await strategy.collateralType()).to.not.eq(await newStrategy.instance.collateralType())

        const accountant = await ethers.getContractAt('PoolAccountant', await pool.poolAccountant())
        await accountant.addStrategy(strategy.address, 100, 0)

        // when
        const tx = pool.connect(governor).migrateStrategy(strategy.address, newStrategy.instance.address)

        // then
        await expect(tx).to.be.revertedWith('collateral-type-must-be-the-same')
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
        const withdrawAmount = (await pool.balanceOf(user1.address)).sub(BN.from('100')).toString()
        await strategy.rebalance()
        let vaultInfo = await cm.getVaultInfo(strategy.address)
        expect(vaultInfo.daiDebt).to.be.gt('0', 'Dai debt should be gt zero')
        await executeIfExist(token.exchangeRateCurrent)
        await strategy.resurface()
        await strategy.rebalance()
        await pool.connect(user1).withdraw(withdrawAmount)
        vaultInfo = await cm.getVaultInfo(strategy.address)
        expect(vaultInfo.daiDebt).to.be.equal('0', 'Dai debt should be zero')
      })
    })
  })
}

module.exports = { shouldValidateMakerCommonBehavior }
