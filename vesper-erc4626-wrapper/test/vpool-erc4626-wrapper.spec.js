'use strict'

const { expect } = require('chai')
const { ethers } = require('hardhat')
const { time, loadFixture, setStorageAt } = require('@nomicfoundation/hardhat-network-helpers')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { unlock } = require('vesper-commons/utils/setup')
const { address: Address } = require('vesper-commons/utils/chains').getChainData()

const { parseEther } = ethers.utils

describe('VPoolERC4626Wrapper', function () {
  let proxyAdmin
  let wallet
  let vsp
  let dai
  let vaDAI
  let wvaDAI
  let poolAccountant
  let poolRewards
  let wrapperPoolRewards

  async function fixture() {
    dai = await ethers.getContractAt('IERC20', Address.DAI, wallet)
    vsp = await ethers.getContractAt('IERC20', Address.Vesper.VSP, wallet)
    vaDAI = await ethers.getContractAt('VPool', Address.Vesper.vaDAI, wallet)
    poolRewards = await ethers.getContractAt('IPoolRewards', await vaDAI.poolRewards(), wallet)
    poolAccountant = await ethers.getContractAt('PoolAccountant', await vaDAI.poolAccountant(), wallet)

    const wrapperFactory = await ethers.getContractFactory('VPoolERC4626Wrapper', wallet)
    const wvaDaiImpl = await wrapperFactory.deploy()

    const proxyFactory = await ethers.getContractFactory('TransparentUpgradeableProxy', wallet)
    const wvaDaiProxy = await proxyFactory.deploy(wvaDaiImpl.address, proxyAdmin.address, '0x')

    wvaDAI = await ethers.getContractAt('VPoolERC4626Wrapper', wvaDaiProxy.address, wallet)
    await wvaDAI.initialize(vaDAI.address)

    const wrapperPoolRewardsFactory = await ethers.getContractFactory('VPoolERC4626WrapperRewards', wallet)
    wrapperPoolRewards = await wrapperPoolRewardsFactory.deploy()
    await wrapperPoolRewards.initialize(wvaDAI.address, [vsp.address])

    const vPoolGovernor = await unlock(await vaDAI.governor())
    await wvaDAI.connect(vPoolGovernor).updateWrapperRewards(wrapperPoolRewards.address)
  }

  beforeEach(async function () {
    ;[proxyAdmin, wallet] = await ethers.getSigners()

    await loadFixture(fixture)
    expect(await vaDAI.balanceOf(wvaDAI.address)).eq(0)
    expect(await wvaDAI.totalSupply()).eq(0)
    expect(await wvaDAI.totalAssets()).eq(0)
  })

  it('should have correct params', async function () {
    expect(await wvaDAI.asset()).eq(dai.address)
    expect(await wvaDAI.vToken()).eq(vaDAI.address)
    expect(await wvaDAI.name()).eq('ERC4626-Wrapped Vesper vaDAI')
  })

  describe('when externalDepositFee == 0 ', function () {
    beforeEach(async function () {
      expect(await poolAccountant.externalDepositFee()).eq(0)
    })

    it('deposit', async function () {
      // given
      const daiToDeposit = parseEther('100')
      const wvPoolExpectedToMint = await wvaDAI.previewDeposit(daiToDeposit)
      const vPoolExpected = await vaDAI.calculateMintage(daiToDeposit)
      const vPoolBefore = await vaDAI.balanceOf(wvaDAI.address)
      const totalValueBefore = await vaDAI.totalValue()

      // when
      await adjustBalance(dai.address, wallet.address, daiToDeposit)
      await dai.approve(wvaDAI.address, daiToDeposit)
      await wvaDAI.deposit(daiToDeposit, wallet.address)
      expect(await dai.balanceOf(wallet.address)).eq(0)

      // then
      const wvPoolBalance = await wvaDAI.balanceOf(wallet.address)
      const wvPoolSupply = await wvaDAI.totalSupply()
      const vPoolAfter = await vaDAI.balanceOf(wvaDAI.address)
      const vPoolMinted = vPoolAfter.sub(vPoolBefore)
      const totalValueAfter = await vaDAI.totalValue()
      const deposited = totalValueAfter.sub(totalValueBefore)
      expect(wvPoolExpectedToMint).eq(vPoolExpected).eq(wvPoolBalance).eq(wvPoolSupply).eq(vPoolMinted)
      expect(deposited).eq(daiToDeposit)
    })

    it('mint', async function () {
      // given
      const wvPoolToMint = parseEther('100')
      const daiExpected = await wvaDAI.previewMint(wvPoolToMint)
      const totalValueBefore = await vaDAI.totalValue()
      const vPoolBefore = await vaDAI.balanceOf(wvaDAI.address)

      // when
      await adjustBalance(dai.address, wallet.address, daiExpected)
      await dai.approve(wvaDAI.address, daiExpected)
      await wvaDAI.mint(wvPoolToMint, wallet.address)
      expect(await dai.balanceOf(wallet.address)).eq(0)

      // then
      const wvPoolBalance = await wvaDAI.balanceOf(wallet.address)
      const wvPoolSupply = await wvaDAI.totalSupply()
      const vPoolAfter = await vaDAI.balanceOf(wvaDAI.address)
      const vPoolMinted = vPoolAfter.sub(vPoolBefore)
      const totalValueAfter = await vaDAI.totalValue()
      const deposited = totalValueAfter.sub(totalValueBefore)
      expect(wvPoolBalance).eq(wvPoolSupply).eq(vPoolMinted).eq(wvPoolToMint)
      expect(daiExpected).eq(deposited)
    })
  })

  describe('when externalDepositFee > 0 ', function () {
    beforeEach(async function () {
      const externalDepositFee = 500 // 5%

      const index = 6
      const value = ethers.utils.hexlify(ethers.utils.zeroPad(externalDepositFee, 32))
      await setStorageAt(poolAccountant.address, index, value)

      expect(await poolAccountant.externalDepositFee()).eq(externalDepositFee)
    })

    it('deposit', async function () {
      // given
      const daiToDeposit = parseEther('100')
      const wvPoolExpectedToMint = await wvaDAI.previewDeposit(daiToDeposit)
      const vPoolExpected = await vaDAI.calculateMintage(daiToDeposit)
      const vPoolBefore = await vaDAI.balanceOf(wvaDAI.address)
      const totalValueBefore = await vaDAI.totalValue()

      // when
      await adjustBalance(dai.address, wallet.address, daiToDeposit)
      await dai.approve(wvaDAI.address, daiToDeposit)
      await wvaDAI.deposit(daiToDeposit, wallet.address)
      expect(await dai.balanceOf(wallet.address)).eq(0)

      // then
      const wvPoolBalance = await wvaDAI.balanceOf(wallet.address)
      const wvPoolSupply = await wvaDAI.totalSupply()
      const vPoolAfter = await vaDAI.balanceOf(wvaDAI.address)
      const vPoolMinted = vPoolAfter.sub(vPoolBefore)
      const totalValueAfter = await vaDAI.totalValue()
      const deposited = totalValueAfter.sub(totalValueBefore)
      expect(wvPoolExpectedToMint).eq(vPoolExpected).eq(wvPoolBalance).eq(wvPoolSupply).eq(vPoolMinted)
      expect(deposited).eq(daiToDeposit)
    })

    it('mint', async function () {
      // given
      const wvPoolToMint = parseEther('100')
      const daiExpected = await wvaDAI.previewMint(wvPoolToMint)
      const totalValueBefore = await vaDAI.totalValue()
      const vPoolBefore = await vaDAI.balanceOf(wvaDAI.address)

      // when
      await adjustBalance(dai.address, wallet.address, daiExpected)
      await dai.approve(wvaDAI.address, daiExpected)
      await wvaDAI.mint(wvPoolToMint, wallet.address)
      expect(await dai.balanceOf(wallet.address)).eq(0)

      // then
      const wvPoolBalance = await wvaDAI.balanceOf(wallet.address)
      const wvPoolSupply = await wvaDAI.totalSupply()
      const vPoolAfter = await vaDAI.balanceOf(wvaDAI.address)
      const vPoolMinted = vPoolAfter.sub(vPoolBefore)
      const totalValueAfter = await vaDAI.totalValue()
      const deposited = totalValueAfter.sub(totalValueBefore)
      expect(wvPoolBalance).eq(wvPoolSupply).eq(vPoolMinted).eq(wvPoolToMint)
      expect(daiExpected).eq(deposited)
    })
  })

  describe('when user has deposit', function () {
    beforeEach(async function () {
      const daiToDeposit = parseEther('100')
      await adjustBalance(dai.address, wallet.address, daiToDeposit)
      await dai.approve(wvaDAI.address, daiToDeposit)
      await wvaDAI.deposit(daiToDeposit, wallet.address)
      expect(await dai.balanceOf(wallet.address)).eq(0)
      expect(await vsp.balanceOf(wallet.address)).eq(0)
    })

    describe('full withdraw', function () {
      it('withdraw', async function () {
        // given
        const shares = await wvaDAI.balanceOf(wallet.address)
        const expectedToWithdraw = await wvaDAI.previewRedeem(shares)
        const wvPoolExpectedToBurn = await wvaDAI.previewWithdraw(expectedToWithdraw)
        const totalValueBefore = await vaDAI.totalValue()
        expect(wvPoolExpectedToBurn).eq(shares)

        // when
        const assets = await wvaDAI.convertToAssets(shares)
        expect(assets).eq(expectedToWithdraw)
        await wvaDAI.withdraw(assets, wallet.address, wallet.address)

        // then
        const totalValueAfter = await vaDAI.totalValue()
        const withdrawn = totalValueBefore.sub(totalValueAfter)
        expect(await dai.balanceOf(wallet.address))
          .eq(withdrawn)
          .eq(expectedToWithdraw)
        expect(await wvaDAI.balanceOf(wallet.address)).eq(0)
      })

      it('redeem', async function () {
        // given
        const shares = await wvaDAI.balanceOf(wallet.address)
        const assets = await wvaDAI.convertToAssets(shares)
        const expectedToWithdraw = await wvaDAI.previewRedeem(shares)
        const totalValueBefore = await vaDAI.totalValue()
        expect(expectedToWithdraw).eq(assets)

        // when
        await wvaDAI.redeem(shares, wallet.address, wallet.address)

        // then
        const totalValueAfter = await vaDAI.totalValue()
        const withdrawn = totalValueBefore.sub(totalValueAfter)
        expect(await dai.balanceOf(wallet.address))
          .eq(expectedToWithdraw)
          .eq(withdrawn)
        expect(await wvaDAI.balanceOf(wallet.address)).eq(0)
      })
    })

    describe('when wrapper has rewards accrued', function () {
      let vspAccrued

      beforeEach(async function () {
        await time.increase(time.duration.days(30))
        const { _claimableAmounts: claimableFromVPool } = await poolRewards.claimable(wvaDAI.address)
        ;[vspAccrued] = claimableFromVPool
        expect(vspAccrued).gt(0)
      })

      it('updateRewards', async function () {
        // when
        await wvaDAI.updateRewards(wallet.address)
        await time.increase(await wrapperPoolRewards.periodFinish(vsp.address))

        // then
        const { _claimableAmounts: claimableFromWrapper } = await wrapperPoolRewards.claimable(wallet.address)
        const [vspToClaim] = claimableFromWrapper
        expect(vspToClaim).closeTo(vspAccrued, parseEther('0.000001'))
      })

      it('claimReward', async function () {
        // given
        await time.increase(time.duration.days(30))
        await wvaDAI.updateRewards(wallet.address)
        await time.increase(await wrapperPoolRewards.periodFinish(vsp.address))
        const { _claimableAmounts } = await wrapperPoolRewards.claimable(wallet.address)
        const [claimable] = _claimableAmounts

        // when
        await wvaDAI.claimRewards(wallet.address)

        // then
        expect(await vsp.balanceOf(wallet.address)).eq(claimable)
      })
    })
  })

  describe('partial withdraw', function () {
    beforeEach('when there is not enough collateral for user to withdraw', async function () {
      const governor = await unlock(await vaDAI.governor())
      poolAccountant = poolAccountant.connect(governor)

      // Set all strategies' debt ratio to 0
      const strategies = await poolAccountant.getStrategies()
      for (let i = 0; i < strategies.length; ++i) {
        const strategyAddress = strategies[i]
        if ((await poolAccountant.totalDebtOf(strategyAddress)).gt(0)) {
          await poolAccountant.updateDebtRatio(strategyAddress, 0)
          const keeper = await unlock(Address.Vesper.KEEPER)
          const strategy = await ethers.getContractAt('IStrategy', strategyAddress, keeper)
          try {
            await strategy.rebalance()
          } catch {
            /* empty */
          }
        }
      }

      // Add strategy mock with 100% debt ratio
      const strategyMockFactory = await ethers.getContractFactory('StrategyMock', wallet)
      const strategyMock = await strategyMockFactory.deploy(vaDAI.address)
      await poolAccountant.addStrategy(strategyMock.address, 10000, 0)
      await strategyMock.rebalance()

      // Deposit twice the remain amount deposited on other strategies
      const maxToWithdraw = (await poolAccountant.totalDebt()).sub(
        await poolAccountant.totalDebtOf(strategyMock.address),
      )
      const daiToDeposit = maxToWithdraw.mul(2)
      await adjustBalance(dai.address, wallet.address, daiToDeposit)
      await dai.approve(wvaDAI.address, daiToDeposit)
      await wvaDAI.deposit(daiToDeposit, wallet.address)

      // Move deposit amount to the strategy mock
      await strategyMock.rebalance()

      // Set strategy mock as the only strategy in the withdraw queue
      const withdrawQueueArrayIndex = 4
      await setStorageAt(poolAccountant.address, withdrawQueueArrayIndex, 1) // set array length to `1`
      const arraySlot = ethers.BigNumber.from(ethers.utils.solidityKeccak256(['uint256'], [withdrawQueueArrayIndex]))
      const elementSlot = arraySlot.toHexString()
      const value = ethers.utils.hexlify(ethers.utils.zeroPad(strategyMock.address, 32))
      await setStorageAt(poolAccountant.address, elementSlot, value)
      expect(await poolAccountant.getWithdrawQueue()).deep.eq([strategyMock.address])

      // drain DAI from the strategy mock (leave 1 DAI to avoid revert due to 0 withdrawn amount)
      const toDrain = (await dai.balanceOf(strategyMock.address)).sub(parseEther('1'))
      await strategyMock.withdraw(toDrain)
    })

    it('withdraw', async function () {
      // given
      const shares = await wvaDAI.balanceOf(wallet.address)
      const assets = await wvaDAI.convertToAssets(shares)
      // Note: Since it isn't feasible to discover when partial withdraw will occur, returns usual amount on preview
      expect(await wvaDAI.previewWithdraw(assets)).gt(0)

      // when
      const tx = wvaDAI.withdraw(assets, wallet.address, wallet.address)

      // then
      await expect(tx).revertedWith('partially-withdraw-not-supported')
    })

    it('redeem', async function () {
      // given
      const shares = await wvaDAI.balanceOf(wallet.address)
      // Note: Since it isn't feasible to discover when partial withdraw will occur, returns usual amount on preview
      expect(await wvaDAI.previewRedeem(shares)).gt(0)

      // when
      const tx = wvaDAI.redeem(shares, wallet.address, wallet.address)

      // then
      await expect(tx).revertedWith('partially-withdraw-not-supported')
    })
  })
})
