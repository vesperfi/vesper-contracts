'use strict'
const { ethers } = require('hardhat')
const { unlock } = require('vesper-commons/utils/contractHelper')
const { expect } = require('chai')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { DAI, Vesper } = require('vesper-commons/config/mainnet/address')

const vaDaiAddress = '0x0538C8bAc84E95A9dF8aC10Aad17DbE81b9E36ee'

describe('Withdraw from Rari', function () {
  it('should withdraw from Rari using dummy strategy', async function () {
    const rariStrategyAddress = '0xd10427bbd5D20f6b3f8c50a9447d8ac50CDC15bf'
    const fDaiAddress = '0x19D13B4C0574B8666e9579Da3C387D5287AF410c'
    const vaDAI = await ethers.getContractAt('VPool', vaDaiAddress)
    let dai = await ethers.getContractAt('ERC20', DAI)
    let cToken = await ethers.getContractAt('CToken', fDaiAddress)

    const governor = await vaDAI.governor()
    const multisigSigner = await unlock(governor)
    const sFactory = await ethers.getContractFactory('DummyStrategy', multisigSigner)
    const dummy = await sFactory.deploy(vaDAI.address, Vesper.Swapper, ethers.constants.AddressZero, 'Dummy')
    await dummy.approveToken(ethers.constants.MaxUint256)
    await dummy.updateFeeCollector(governor)

    const ppsBefore = await vaDAI.pricePerShare()
    const badDebt = (await vaDAI.strategy(rariStrategyAddress))._totalDebt
    expect(badDebt).gt(0)

    await vaDAI.connect(multisigSigner).migrateStrategy(rariStrategyAddress, dummy.address)

    const reduceDebtBy = ethers.utils.parseEther('1000')
    await adjustBalance(DAI, dummy.address, reduceDebtBy)

    const data = await dummy.callStatic.rebalance()
    expect(data._payback).eq(reduceDebtBy)
    await dummy.rebalance()
    expect(await vaDAI.pricePerShare()).eq(ppsBefore)

    // Verify new debt in dummy is reduced
    expect((await vaDAI.strategy(dummy.address))._totalDebt).eq(badDebt.sub(reduceDebtBy))

    let cTokenBalance = await cToken.balanceOf(governor)
    // sweep fToken to fee collector
    await dummy.sweep(fDaiAddress)
    await expect(cTokenBalance).gt(0)

    let daiBalanceBefore = await dai.balanceOf(cToken.address)
    await cToken.connect(multisigSigner).redeemUnderlying(daiBalanceBefore)
    let daiBalanceAfter = await dai.balanceOf(cToken.address)
    expect(daiBalanceAfter).eq(0)
  })
})
