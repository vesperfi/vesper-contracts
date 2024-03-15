'use strict'
const { ethers } = require('hardhat')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const { unlock } = require('vesper-commons/utils/contractHelper')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { AaveV3_Vesper_Xy_STETH_USDC: strategyConfig } = require('vesper-commons/config/mainnet/strategyConfig')
const { Vesper, USDC } = require('vesper-commons/config/mainnet/address')
const { expect } = require('chai')

describe('aaveV3-Vesper-stETH-USDC: rebalance and migrate', function () {
  it('should migrate and rebalance', async function () {
    await helpers.reset(process.env.NODE_URL, 19391000)
    const keeper = '0x169e2FfC1c6b229b04E65A431434bF0e8eD9563d'
    const keeperSinger = await unlock(keeper)
    const oldStrategyAddress = '0x82562507429876486B60AF4F32390ef0947b3d13'
    const oldStrategy = await ethers.getContractAt('AaveV3VesperStETH', oldStrategyAddress, keeperSinger)

    const vaSTETH = await ethers.getContractAt('VPool', Vesper.vaSTETH)
    const governor = await vaSTETH.governor()
    const governorSigner = await unlock(governor)

    const sFactory = await ethers.getContractFactory('AaveV3VesperStETH', governorSigner)
    const newStrategy = await sFactory.deploy(vaSTETH.address, ...Object.values(strategyConfig.constructorArgs))
    await newStrategy.approveToken(ethers.constants.MaxUint256)
    await newStrategy.updateFeeCollector(governor)
    let ppsBefore = await vaSTETH.pricePerShare()
    // Reduce borrow limit and rebalance
    await oldStrategy.connect(governorSigner).updateBorrowLimit(6000, 7000)
    await oldStrategy.rebalance()
    let ppsAfter = await vaSTETH.pricePerShare()
    expect(ppsAfter).to.gte(ppsBefore)
    ppsBefore = ppsAfter
    // Send 1 USDC
    await adjustBalance(USDC, oldStrategy.address, ethers.utils.parseUnits('1', '6'))
    // Migrate to new strategy
    await vaSTETH.connect(governorSigner).migrateStrategy(oldStrategy.address, newStrategy.address)
    // Rebalance
    await newStrategy.rebalance()
    ppsAfter = await vaSTETH.pricePerShare()
    expect(ppsAfter).to.gte(ppsBefore)
  })
})
