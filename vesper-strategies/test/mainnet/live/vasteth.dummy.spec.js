'use strict'
const { ethers } = require('hardhat')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const { unlock } = require('vesper-commons/utils/contractHelper')
const { Maker_Dummy_STETH: strategyConfig } = require('vesper-commons/config/mainnet/strategyConfig')
const { Vesper } = require('vesper-commons/config/mainnet/address')
const { expect } = require('chai')

describe('MakerVesperStETH: migrate and report loss', function () {
  it('should migrate and report loss', async function () {
    await helpers.reset(process.env.NODE_URL, 20485500)
    const keeper = '0x169e2FfC1c6b229b04E65A431434bF0e8eD9563d'
    const keeperSinger = await unlock(keeper)
    const oldStrategyAddress = '0xf1543e97c79B3581a2eD60184f5dac840eFB20f5'
    const oldStrategy = await ethers.getContractAt('MakerVesperStETH', oldStrategyAddress, keeperSinger)

    const vaSTETH = await ethers.getContractAt('VPool', Vesper.vaSTETH)
    const governor = await vaSTETH.governor()
    const governorSigner = await unlock(governor)

    const sFactory = await ethers.getContractFactory('MakerDummy', governorSigner)
    const newStrategy = await sFactory.deploy(vaSTETH.address, ...Object.values(strategyConfig.constructorArgs))
    await newStrategy.approveToken(ethers.constants.MaxUint256)
    await newStrategy.updateFeeCollector(governor)

    const ppsBefore = await vaSTETH.pricePerShare()
    // Migrate to new strategy
    await vaSTETH.connect(governorSigner).migrateStrategy(oldStrategy.address, newStrategy.address)
    // Rebalance to report loss
    await newStrategy.rebalanceToReportLoss(ethers.utils.parseEther('2.7'))
    const ppsAfter = await vaSTETH.pricePerShare()
    // due to loss report PPS will go down
    expect(ppsAfter).to.lt(ppsBefore)
  })
})
