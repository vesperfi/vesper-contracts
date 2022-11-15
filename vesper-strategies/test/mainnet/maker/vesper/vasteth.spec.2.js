'use strict'

const { smock } = require('@defi-wonderland/smock')
const { expect } = require('chai')
const { getChainData } = require('vesper-commons/utils/chains')
const { adjustBalance } = require('vesper-commons/utils/balance')
const addresses = getChainData().address
const { ethers } = require('hardhat')
const { strategyConfig } = getChainData()

describe('Maker', function () {
  describe('stETH Maker strategy', function () {
    let poolMock, strategy, governor, alice
    beforeEach(async function () {
      ;[governor, alice] = await ethers.getSigners()
      poolMock = await smock.fake('VPool')
      poolMock.token.returns(addresses.stETH)
      poolMock.governor.returns(governor.address)
      const strategyParams = strategyConfig['Maker_Vesper_STETH']
      const contractFactory = await ethers.getContractFactory(strategyParams.contract)
      strategy = await contractFactory.deploy(poolMock.address, ...Object.values(strategyParams.constructorArgs))
      await strategy.createVault()
      await strategy.approveToken()
      await strategy.updateFeeCollector(alice.address)
      const amount = ethers.utils.parseUnits('100', '18')
      await adjustBalance(addresses.stETH, strategy.address, amount)
      // send 100 stETh and borrow some DAI from maker.
      await strategy.rebalance()
      poolMock.totalDebtOf.returns(amount)
    })
    it('should report earning if rebase token automatically increasing in vault', async function () {
      // collateral in vault is greater than strategy debt.
      poolMock.totalDebtOf.returns(ethers.utils.parseUnits('99', '18'))
      const data = await strategy.callStatic.rebalance()
      expect(data._profit).to.be.gt('999999999999999990', 'profit should be 0.99e18')
    })

    it('should withdraw all from vault', async function () {
      poolMock.excessDebt.returns(ethers.utils.parseUnits('100', '18'))
      const data = await strategy.callStatic.rebalance()
      expect(data._profit).to.be.eq('0', 'profit should be 0')
      expect(data._payback).to.be.gt('99999999999999999990', '_payback should be 99.99e18 ')
    })

    it('should report DAI profit', async function () {
      const amount = ethers.utils.parseUnits('100', '18')
      await adjustBalance(addresses.DAI, strategy.address, amount)
      const data = await strategy.callStatic.rebalance()
      expect(data._profit).to.be.gt('0', 'profit should be greater than 0')
    })
  })
})
