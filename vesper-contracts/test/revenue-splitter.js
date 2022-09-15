'use strict'

const { deployContract, unlock } = require('vesper-commons/utils/setup')
const { deposit } = require('vesper-commons/utils/poolOps')
const { adjustBalance } = require('vesper-commons/utils/balance')
const { getEthQuote, send } = require('../utils/tokenSwapper')
const { ethers } = require('hardhat')
const { BigNumber: BN } = require('ethers')
const { getChainData } = require('vesper-commons/utils/chains')
const helpers = require('@nomicfoundation/hardhat-network-helpers')
const address = getChainData().address
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const VESPER_DEPLOYER = '0xB5AbDABE50b5193d4dB92a16011792B22bA3Ef51'
const DECIMAL18 = BN.from('1000000000000000000')
const { expect, assert } = require('chai')
const TokenLike = 'TokenLike'
const ZERO_ADDRESS = address.ZERO

describe('RevenueSplitter', function () {
  describe('Revenue Splitter Contract deployed', function () {
    let payee1, payee2, payee3, payer1, nonpayee1, user6
    context('General validations', function () {
      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
      })

      it('rejects an empty set of payees', async function () {
        await expect(deployContract('RevenueSplitter', [[], []])).to.be.revertedWith('no-payees')
      })

      it('rejects more payees than share', async function () {
        await expect(
          deployContract('RevenueSplitter', [
            [payee1.address, payee2.address, payee3.address],
            [20, 30],
          ]),
        ).to.be.revertedWith('payees-and-share-length-mismatch')
      })

      it('rejects more share than payees', async function () {
        await expect(
          deployContract('RevenueSplitter', [
            [payee1.address, payee2.address],
            [20, 30, 40],
          ]),
        ).to.be.revertedWith('payees-and-share-length-mismatch')
      })

      it('rejects null payees', async function () {
        await expect(
          deployContract('RevenueSplitter', [
            [payee1.address, ZERO_ADDRESS],
            [20, 30],
          ]),
        ).to.be.revertedWith('payee-is-zero-address')
      })

      it('rejects zero-valued share', async function () {
        await expect(
          deployContract('RevenueSplitter', [
            [payee1.address, payee2.address],
            [20, 0],
          ]),
        ).to.be.revertedWith('payee-with-zero-share')
      })

      it('rejects repeated payees', async function () {
        await expect(
          deployContract('RevenueSplitter', [
            [payee1.address, payee1.address],
            [20, 30],
          ]),
        ).to.be.revertedWith('payee-exists-with-share')
      })
    })

    context('without any ERC20 tokens', function () {
      let payees, shares, psContract, asset1
      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
        payees = [payee1.address, payee2.address]
        shares = [5, 95]
        const vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
        psContract = await deployContract('RevenueSplitter', [payees, shares])
        await psContract.addVToken(address.Vesper.vaETH, ZERO_ADDRESS)
        asset1 = await deployContract('ERC20', ['test', 't1'])
        const token = await vaETH.token()
        const weth = await ethers.getContractAt('TokenLike', token)
        await deposit(vaETH, weth, 1, user6)
      })

      it('has total shares', async function () {
        expect(await psContract.totalShare()).to.be.equal('100')
      })

      it('has all payees', async function () {
        await Promise.all(payees.map(async (payee, index) => expect(await psContract.payees(index)).to.equal(payee)))
      })

      it('all payees initial balance zero', async function () {
        await Promise.all(
          payees.map(async function (payee) {
            expect(await psContract.released(payee, asset1.address)).to.be.equal('0')
          }),
        )
      })

      describe('share', function () {
        it('stores shares if address is payee1.address', async function () {
          expect(await psContract.share(payee1.address)).to.be.equal('5')
        })

        it('stores shares if address is payee2.address', async function () {
          expect(await psContract.share(payee2.address)).to.be.equal('95')
        })

        it('does not store shares if address is not payee', async function () {
          expect(await psContract.share(payee3.address)).to.be.equal('0')
        })
      })

      describe('release', function () {
        it('release tokens without balance to payee1.address', async function () {
          await expect(psContract.release(payee1.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('release tokens without balance to payee2.address', async function () {
          await expect(psContract.release(payee2.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })
      })
    })

    context('with ethers', function () {
      let payees, shares, psContract, amount, vaETH

      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
        amount = BN.from('10').mul(DECIMAL18)
        payees = [payee1.address, payee2.address]
        shares = [5, 95]
        vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
        psContract = await deployContract('RevenueSplitter', [payees, shares])
        await psContract.addVToken(vaETH.address, ZERO_ADDRESS)
        const token = await vaETH.token()
        const weth = await ethers.getContractAt('TokenLike', token)
        await deposit(vaETH, weth, 1, user6)
      })

      it('accepts revenue', async function () {
        await send(payer1.address, psContract.address, amount)
        expect(await ethers.provider.getBalance(psContract.address)).to.be.equal(amount)
      })

      describe('share', function () {
        it('stores shares if address is payee', async function () {
          expect(await psContract.share(payee1.address)).to.be.not.equal('0')
        })

        it('does not store shares if address is not payee', async function () {
          expect(await psContract.share(nonpayee1.address)).to.be.equal('0')
        })
      })

      describe('release', function () {
        it('reverts if no funds to claim', async function () {
          await expect(psContract.releaseEther(payee1.address)).to.be.revertedWith('payee-is-not-due-for-tokens')
        })
        it('reverts if non-payee want to claim', async function () {
          await send(payer1.address, psContract.address, amount)
          await expect(psContract.releaseEther(nonpayee1.address)).to.be.revertedWith('payee-does-not-have-share')
        })

        it('release ether to payee1.address', async function () {
          // receive funds
          await send(payer1.address, psContract.address, amount)
          const initBalance = await ethers.provider.getBalance(psContract.address)
          expect(initBalance).to.be.equal(amount)

          // distribute ether to payee1.address
          const initAmount1 = await ethers.provider.getBalance(payee1.address)
          await psContract.connect(user6).releaseEther(payee1.address)
          const profit1 = (await ethers.provider.getBalance(payee1.address)).sub(initAmount1)
          expect(profit1).to.be.equal(ethers.utils.parseUnits('0.50', 'ether'))
        })

        it('release ether to payee2.address', async function () {
          // receive funds
          await send(payer1.address, psContract.address, amount)
          const initBalance = await ethers.provider.getBalance(psContract.address)
          expect(initBalance).to.be.equal(amount)

          // distribute ether to payee2.address
          const initAmount2 = await ethers.provider.getBalance(payee2.address)
          await psContract.releaseEther(payee2.address)
          const profit2 = (await ethers.provider.getBalance(payee2.address)).sub(initAmount2)
          expect(profit2).to.be.equal(ethers.utils.parseUnits('9.50', 'ether'))
        })
      })
    })

    context('with some ERC20 tokens for two payees', function () {
      let asset1, payees, shares, psContract, mintAmount, vaETH
      const amount = '10000000000000000'
      describe('release tokens to', function () {
        beforeEach(async function () {
          ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
          mintAmount = BN.from(amount).toString()
          asset1 = await deployContract('ERC20', ['test', 't1'])
          payees = [payee1.address, payee2.address]
          shares = [5, 95]
          vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
          psContract = await deployContract('RevenueSplitter', [payees, shares])
          await psContract.addVToken(vaETH.address, ZERO_ADDRESS)

          await adjustBalance(asset1.address, psContract.address, mintAmount)

          const token = await vaETH.token()
          const weth = await ethers.getContractAt('TokenLike', token)
          await deposit(vaETH, weth, 1, user6)
        })

        it('payee1.address', async function () {
          await psContract.release(payee1.address, asset1.address)
          const payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address.')
        })

        it('non-payee want to claim', async function () {
          await expect(psContract.releaseEther(nonpayee1.address)).to.be.revertedWith('payee-does-not-have-share')
        })

        it('payee2.address', async function () {
          await psContract.release(payee2.address, asset1.address)
          const payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')
        })

        it('payee1.address multiple times', async function () {
          await psContract.release(payee1.address, asset1.address)
          await expect(psContract.release(payee1.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee2.address multiple times', async function () {
          await psContract.release(payee2.address, asset1.address)
          await expect(psContract.release(payee2.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee1.address and then transfer to other payee', async function () {
          await psContract.release(payee1.address, asset1.address)
          let payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address.')

          await asset1.connect(payee1).transfer(payee3.address, '100000000000000')

          payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '400000000000000', 'failed-to-transfer-to-other-account')
          const payee3Balance = (await asset1.balanceOf(payee3.address)).toString()
          assert.equal(payee3Balance, '100000000000000', 'failed-to-transfer-to-other-account')
        })

        it('payee2.address and then transfer to other payee', async function () {
          await psContract.release(payee2.address, asset1.address)
          let payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')

          await asset1.connect(payee2).transfer(payee3.address, '100000000000000')

          payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9400000000000000', 'failed-to-transfer-to-other-account')
          const payee3Balance = (await asset1.balanceOf(payee3.address)).toString()
          assert.equal(payee3Balance, '100000000000000', 'failed-to-transfer-to-other-account')
        })

        it('payee1.address, add more tokens and release again', async function () {
          await psContract.release(payee1.address, asset1.address)
          let payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address.')

          const currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(mintAmount))

          await psContract.release(payee1.address, asset1.address)
          payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '1000000000000000', 'releasing-tokens-failed-for-payee1.address.')
        })

        it('payee2.address, add more tokens and release again', async function () {
          await psContract.release(payee2.address, asset1.address)
          let payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')

          const currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(mintAmount))

          await psContract.release(payee2.address, asset1.address)
          payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '19000000000000000', 'releasing-tokens-failed-for-payee2.address.')
        })

        it('payee2.address, add tokens multiple times and release to payee2.address', async function () {
          await psContract.release(payee2.address, asset1.address)
          let payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')
          // Add more tokens multiple times.
          const currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(BN.from(mintAmount).mul(3)))

          await psContract.release(payee2.address, asset1.address)
          payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '38000000000000000', 'releasing-tokens-failed-for-payee2.address.')
        })

        it('add tokens multiple times and then release for both payees multiple times', async function () {
          await psContract.release(payee2.address, asset1.address)
          let payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')
          // Add more tokens multiple times.
          let currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(BN.from(mintAmount).mul(2)))

          await psContract.release(payee2.address, asset1.address)
          payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '28500000000000000', 'releasing-tokens-failed-for-payee2.address.')

          // Add more tokens again
          currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(mintAmount))

          await psContract.release(payee1.address, asset1.address)
          let payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '2000000000000000', 'releasing-tokens-failed-for-payee1.address.')

          // Add more tokens again
          currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(mintAmount))

          await psContract.release(payee1.address, asset1.address)
          payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '2500000000000000', 'releasing-tokens-failed-for-payee1.address.')

          await psContract.release(payee2.address, asset1.address)
          payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '47500000000000000', 'releasing-tokens-failed-for-payee2.address.')
        })
      })
    })

    context('with some ERC20 tokens for three payees', function () {
      let asset1, payees, shares, psContract, vaETH
      const amount = '10000000000000000'
      describe('release tokens to', function () {
        beforeEach(async function () {
          ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
          asset1 = await deployContract('ERC20', ['test', 't1'])
          payees = [payee1.address, payee3.address, payee2.address]
          shares = [20, 30, 950]
          vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
          psContract = await deployContract('RevenueSplitter', [payees, shares])
          await psContract.addVToken(vaETH.address, ZERO_ADDRESS)
          const token = await vaETH.token()
          const weth = await ethers.getContractAt('TokenLike', token)
          await deposit(vaETH, weth, 1, user6)
          const currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(amount))
        })
        it('payee1.address', async function () {
          await psContract.release(payee1.address, asset1.address)
          const payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '200000000000000', 'releasing-tokens-failed-for-payee1.address.')
        })

        it('payee2.address', async function () {
          await psContract.release(payee3.address, asset1.address)
          const payee3Balance = (await asset1.balanceOf(payee3.address)).toString()
          assert.equal(payee3Balance, '300000000000000', 'releasing-tokens-failed-for-payee2.address.')
        })

        it('payee3.address', async function () {
          await psContract.release(payee2.address, asset1.address)
          const payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')
        })
      })
    })

    context('with some tokens for two assets', function () {
      let asset1, asset2, payees, shares, psContract, mintAmount, asset2MintAmount, vaETH
      const amount = '10000000000000000'
      const asset2Amount = '100000000000'

      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
        mintAmount = BN.from(amount).toString()
        asset2MintAmount = BN.from(asset2Amount).toString()
        asset1 = await deployContract('ERC20', ['test1', 't1'])
        asset2 = await deployContract('ERC20', ['test2', 't2'])
        payees = [payee1.address, payee2.address]
        shares = [5, 95]
        vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
        psContract = await deployContract('RevenueSplitter', [payees, shares])
        await psContract.addVToken(vaETH.address, ZERO_ADDRESS)

        await adjustBalance(asset1.address, psContract.address, mintAmount)
        await adjustBalance(asset2.address, psContract.address, asset2MintAmount)
        const token = await vaETH.token()
        const weth = await ethers.getContractAt('TokenLike', token)
        await deposit(vaETH, weth, 5, user6)
      })
      describe('release tokens to', function () {
        it('payee1.address for asset 1', async function () {
          await psContract.release(payee1.address, asset1.address)
          const payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address-asset-1')
        })

        it('payee1.address for asset 2', async function () {
          await psContract.release(payee1.address, asset2.address)
          const payee1Balance = (await asset2.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '5000000000', 'releasing-tokens-failed-for-payee1.address-asset-2')
        })

        it('payee2.address for asset 1', async function () {
          await psContract.release(payee2.address, asset1.address)
          const payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address-asset-1')
        })
        it('payee2.address for asset 2', async function () {
          await psContract.release(payee2.address, asset2.address)
          const payee2Balance = (await asset2.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '95000000000', 'releasing-tokens-failed-for-payee2.address-asset-2')
        })

        it('payee1.address/asset1, add more tokens and release for payee1.address/asset1', async function () {
          await psContract.release(payee1.address, asset1.address)
          let payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address.')

          const currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(amount))

          await psContract.release(payee1.address, asset1.address)
          payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '1000000000000000', 'releasing-tokens-failed-for-payee1.address.')
        })

        it('payee1.address multiple times for asset1', async function () {
          await psContract.release(payee1.address, asset1.address)
          const payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address.')
          await expect(psContract.release(payee1.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee2.address multiple times for asset1', async function () {
          await psContract.release(payee2.address, asset1.address)
          const payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')
          await expect(psContract.release(payee2.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee1.address multiple times for asset2', async function () {
          await psContract.release(payee1.address, asset2.address)
          const payee1Balance = (await asset2.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '5000000000', 'releasing-tokens-failed-for-payee1.address.')
          await expect(psContract.release(payee1.address, asset2.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee2.address multiple times for asset2', async function () {
          await psContract.release(payee2.address, asset2.address)
          const payee2Balance = (await asset2.balanceOf(payee2.address)).toString()
          assert.equal(payee2Balance, '95000000000', 'releasing-tokens-failed-for-payee2.address.')
          await expect(psContract.release(payee2.address, asset2.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee1.address/asset1, add more tokens for asset2 & release for payee1.address/asset1', async function () {
          await psContract.release(payee1.address, asset1.address)
          const payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '500000000000000', 'releasing-tokens-failed-for-payee1.address.')

          const currentBal = await asset2.balanceOf(psContract.address)
          await adjustBalance(asset2.address, psContract.address, currentBal.add(mintAmount))

          await expect(psContract.release(payee1.address, asset1.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })

        it('payee1.address/asset2, add more tokens for asset1 & release for payee1.address/asset2', async function () {
          await psContract.release(payee1.address, asset2.address)
          const payee1Balance = (await asset2.balanceOf(payee1.address)).toString()
          assert.equal(payee1Balance, '5000000000', 'releasing-tokens-failed-for-payee1.address.')

          const currentBal = await asset1.balanceOf(psContract.address)
          await adjustBalance(asset1.address, psContract.address, currentBal.add(mintAmount))

          await expect(psContract.release(payee1.address, asset2.address)).to.be.revertedWith(
            'payee-is-not-due-for-tokens',
          )
        })
      })

      it('add tokens multiple times for two assets and release for both payees multiple times', async function () {
        await psContract.release(payee2.address, asset1.address)
        let payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
        assert.equal(payee2Balance, '9500000000000000', 'releasing-tokens-failed-for-payee2.address.')
        // Add more tokens multiple times for both assets
        let currentBal1 = await asset1.balanceOf(psContract.address)
        await adjustBalance(asset1.address, psContract.address, currentBal1.add(BN.from(mintAmount).mul(2)))
        let currentBal2 = await asset2.balanceOf(psContract.address)
        await adjustBalance(asset2.address, psContract.address, currentBal2.add(BN.from(asset2MintAmount).mul(2)))

        await psContract.release(payee2.address, asset1.address)
        payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
        assert.equal(payee2Balance, '28500000000000000', 'releasing-tokens-failed-for-payee2.address.')

        await psContract.release(payee2.address, asset2.address)
        payee2Balance = (await asset2.balanceOf(payee2.address)).toString()
        assert.equal(payee2Balance, '285000000000', 'releasing-tokens-failed-for-payee2.address.')

        // Add more tokens again
        currentBal1 = await asset1.balanceOf(psContract.address)
        await adjustBalance(asset1.address, psContract.address, currentBal1.add(mintAmount))
        currentBal2 = await asset2.balanceOf(psContract.address)
        await adjustBalance(asset2.address, psContract.address, currentBal2.add(asset2MintAmount))

        await psContract.release(payee1.address, asset1.address)
        let payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
        assert.equal(payee1Balance, '2000000000000000', 'releasing-tokens-failed-for-payee1.address.')

        await psContract.release(payee1.address, asset2.address)
        payee1Balance = (await asset2.balanceOf(payee1.address)).toString()
        assert.equal(payee1Balance, '20000000000', 'releasing-tokens-failed-for-payee1.address.')

        // Add more tokens again
        currentBal1 = await asset1.balanceOf(psContract.address)
        await adjustBalance(asset1.address, psContract.address, currentBal1.add(mintAmount))
        currentBal2 = await asset2.balanceOf(psContract.address)
        await adjustBalance(asset2.address, psContract.address, currentBal2.add(asset2MintAmount))

        await psContract.release(payee1.address, asset1.address)
        payee1Balance = (await asset1.balanceOf(payee1.address)).toString()
        assert.equal(payee1Balance, '2500000000000000', 'releasing-tokens-failed-for-payee1.address.')

        await psContract.release(payee2.address, asset1.address)
        payee2Balance = (await asset1.balanceOf(payee2.address)).toString()
        assert.equal(payee2Balance, '47500000000000000', 'releasing-tokens-failed-for-payee2.address.')

        await psContract.release(payee1.address, asset2.address)
        payee1Balance = (await asset2.balanceOf(payee1.address)).toString()
        assert.equal(payee1Balance, '25000000000', 'releasing-tokens-failed-for-payee1.address.')

        await psContract.release(payee2.address, asset2.address)
        payee2Balance = (await asset2.balanceOf(payee2.address)).toString()
        assert.equal(payee2Balance, '475000000000', 'releasing-tokens-failed-for-payee2.address.')
      })
    })

    context('Vesper Deployer Account top-up with vaETH token', function () {
      let payees, shares, psContract, vaETH, asset1
      const low = '10000000000000000000' // 10 eth
      const high = '20000000000000000000' // 20 eth

      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
        payees = [payee1.address, payee2.address]
        shares = [5, 95]
        psContract = await deployContract('RevenueSplitter', [payees, shares])
        asset1 = await deployContract('ERC20', ['test', 't1'])
        const amount = '10000000000000000'
        const mintAmount = BN.from(amount).toString()
        await adjustBalance(asset1.address, psContract.address, mintAmount)
        vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
        await adjustBalance(vaETH.address, VESPER_DEPLOYER, 0)
        await psContract.addVToken(vaETH.address, ZERO_ADDRESS)
        const token = await vaETH.token()
        const weth = await ethers.getContractAt('TokenLike', token)
        await deposit(vaETH, weth, 1, user6)
        await psContract.toggleTopUpStatus()
      })

      it('should not allow to top-up when top-up is disabled', async function () {
        // Toggle status to disable
        await psContract.toggleTopUpStatus()
        const tx = psContract.topUp()
        await expect(tx).revertedWith('top-up-is-disabled')
      })

      it('should not top-up by default on release', async function () {
        // Keep 10 ether at VESPER_DEPLOYER
        const signer = await unlock(VESPER_DEPLOYER)
        await helpers.setBalance(VESPER_DEPLOYER, ethers.utils.parseEther('0'))
        await send(user6.address, VESPER_DEPLOYER, BN.from('10').mul(DECIMAL18))

        // Transfer some vaETH at revenue splitter contract address to bring VESPER_DEPLOYER balance < low level
        await vaETH.connect(signer)['deposit()']({ value: BN.from('8').mul(DECIMAL18).toString() })
        const vaethAmount = BN.from('6').mul(DECIMAL18)
        await vaETH.connect(signer).transfer(psContract.address, vaethAmount.toString())

        // eth balance below low level
        const ethBalanceBefore = await ethers.provider.getBalance(VESPER_DEPLOYER)
        expect(ethBalanceBefore).to.be.lt(BN.from(low), 'eth balance is above low value')

        // Check vaETH at revenue splitter contract address
        const psVethBalanceBefore = await vaETH.balanceOf(psContract.address)
        expect(psVethBalanceBefore).to.be.equal(BN.from(vaethAmount), 'wrong vaeth amount')
        const vdVethBalanceBefore = await vaETH.balanceOf(VESPER_DEPLOYER)

        // release
        await psContract.release(payee1.address, asset1.address)
        const vdVethBalanceAfter = await vaETH.balanceOf(VESPER_DEPLOYER)

        expect(vdVethBalanceBefore).to.be.equal(vdVethBalanceAfter, 'Top-up should not have done')
      })

      it('should top-up on release when isAutoTopUpEnabled is set to true', async function () {
        await psContract.toggleAutoTopUp()

        // Keep 10 ether at VESPER_DEPLOYER
        const signer = await unlock(VESPER_DEPLOYER)
        await helpers.setBalance(VESPER_DEPLOYER, ethers.utils.parseEther('0'))
        await send(user6.address, VESPER_DEPLOYER, BN.from('10').mul(DECIMAL18))

        // Transfer some vaETH at revenue splitter contract address to bring VESPER_DEPLOYER balance < low level
        await vaETH.connect(signer)['deposit()']({ value: BN.from('8').mul(DECIMAL18).toString() })
        const vaethAmount = BN.from('6').mul(DECIMAL18)
        await vaETH.connect(signer).transfer(psContract.address, vaethAmount.toString())

        // eth balance below low level
        const ethBalanceBefore = await ethers.provider.getBalance(VESPER_DEPLOYER)
        expect(ethBalanceBefore).to.be.lt(BN.from(low), 'eth balance is above low value')

        // Check vaETH at revenue splitter contract address
        const psVethBalanceBefore = await vaETH.balanceOf(psContract.address)
        expect(psVethBalanceBefore).to.be.equal(BN.from(vaethAmount), 'wrong vaETH amount')
        const vdVethBalanceBefore = await vaETH.balanceOf(VESPER_DEPLOYER)

        // release
        await psContract.release(payee1.address, asset1.address)
        const vdVethBalanceAfter = await vaETH.balanceOf(VESPER_DEPLOYER)

        expect(vdVethBalanceAfter).to.be.gt(vdVethBalanceBefore, 'top-up failed')
      })

      it('should top-up vesper deployer to exact high level', async function () {
        // Keep 23 ether at VESPER_DEPLOYER
        const signer = await unlock(VESPER_DEPLOYER)
        await helpers.setBalance(VESPER_DEPLOYER, ethers.utils.parseEther('0'))
        await send(user6.address, VESPER_DEPLOYER, BN.from('10').mul(DECIMAL18))
        await send(user6.address, VESPER_DEPLOYER, BN.from('13').mul(DECIMAL18))

        // Transfer some vaETH at revenue splitter contract address to bring VESPER_DEPLOYER balance < low level
        await vaETH.connect(signer)['deposit()']({ value: BN.from('22').mul(DECIMAL18).toString() })
        const vaethAmount = BN.from('21').mul(DECIMAL18)
        await vaETH.connect(signer).transfer(psContract.address, vaethAmount.toString())
        const pricePerShare = await vaETH.pricePerShare()
        // eth balance below low level
        const vesperEthBalanceBefore = await ethers.provider.getBalance(VESPER_DEPLOYER)
        const vdVethBalanceBefore = await vaETH.balanceOf(VESPER_DEPLOYER)
        const totalVesperBefore = vesperEthBalanceBefore.add(vdVethBalanceBefore)
        expect(totalVesperBefore).to.be.lt(BN.from(low), 'eth balance is above low value')

        // Check vaETH at revenue splitter contract address
        const psVethBalanceBefore = await vaETH.balanceOf(psContract.address)
        expect(psVethBalanceBefore).to.be.equal(BN.from(vaethAmount), 'wrong vaeth amount')

        // Top-up vesper deployer
        await psContract.connect(user6).topUp()
        const vesperEthBalanceAfter = await ethers.provider.getBalance(VESPER_DEPLOYER)
        const vdVethBalanceAfter = await vaETH.balanceOf(VESPER_DEPLOYER)

        const totalVesperAfter = vesperEthBalanceAfter.add(vdVethBalanceAfter.mul(pricePerShare).div(DECIMAL18))
        const psVethBalanceAfter = await vaETH.balanceOf(psContract.address)
        const expectedAmountTransfer = psVethBalanceBefore.sub(psVethBalanceAfter)
        const actualAmountTransfer = vdVethBalanceAfter.sub(vdVethBalanceBefore)

        expect(expectedAmountTransfer).to.be.equal(actualAmountTransfer, 'Top-up done with wrong amount')
        expect(totalVesperAfter.sub(high), 'vesper deployer should be close to high balance').to.closeTo(0, 10)
      })

      it('should top-up vesper deployer with less than high level amount', async function () {
        // Keep 25 ether at VESPER_DEPLOYER
        const signer = await unlock(VESPER_DEPLOYER)
        await helpers.setBalance(VESPER_DEPLOYER, ethers.utils.parseEther('0'))
        await send(user6.address, VESPER_DEPLOYER, BN.from('10').mul(DECIMAL18))
        await send(user6.address, VESPER_DEPLOYER, BN.from('15').mul(DECIMAL18))

        // Transfer some vaETH at revenue splitter contract address to bring VESPER_DEPLOYER balance < low level
        await vaETH.connect(signer)['deposit()']({ value: BN.from('23').mul(DECIMAL18).toString() })
        const vaethAmount = BN.from('22').mul(DECIMAL18) // high level is 20 so transfer > 20
        await vaETH.connect(signer).transfer(psContract.address, vaethAmount.toString())

        // eth balance below low level
        const ethBalanceBefore = await ethers.provider.getBalance(VESPER_DEPLOYER)
        expect(ethBalanceBefore).to.be.lt(BN.from(low), 'eth balance is above low value')

        // Check vaETH at revenue splitter contract address
        const psVethBalanceBefore = await vaETH.balanceOf(psContract.address)
        expect(psVethBalanceBefore).to.be.equal(BN.from(vaethAmount), 'wrong vaeth amount')

        // calculate total vesper deployer balance
        const weth = await ethers.getContractAt(TokenLike, WETH)
        const vesperWethBalanceBefore = await weth.balanceOf(VESPER_DEPLOYER)
        const vdVethBalanceBefore = await vaETH.balanceOf(VESPER_DEPLOYER)
        const totalVesperBalanceBefore = ethBalanceBefore.add(BN.from(vesperWethBalanceBefore)).add(vdVethBalanceBefore)
        // Top-up vesper deployer
        await psContract.connect(user6).topUp()
        const pricePerShare = await vaETH.pricePerShare()
        const vdVethBalanceAfter = (await vaETH.balanceOf(VESPER_DEPLOYER)).mul(pricePerShare).div(DECIMAL18)
        const psVethBalanceAfter = await vaETH.balanceOf(psContract.address)

        const actualDiff = BN.from(vdVethBalanceAfter).sub(BN.from(vdVethBalanceBefore))
        const expectedDiff = BN.from(high).sub(BN.from(totalVesperBalanceBefore))
        expect(vdVethBalanceAfter).to.be.lte(high, 'vesper deployer have > high balance')
        expect(expectedDiff, 'Top-up amount not matching').to.closeTo(actualDiff, 10)
        expect(psVethBalanceAfter).to.be.lt(psVethBalanceBefore, 'failed to transfer partial amount')
      })

      it('should not top-up vesper deployer when balance is greater than low level', async function () {
        // Transfer 25 ether at VESPER_DEPLOYER
        const signer = await unlock(VESPER_DEPLOYER)
        await send(user6.address, VESPER_DEPLOYER, BN.from('15').mul(DECIMAL18))
        await send(user6.address, VESPER_DEPLOYER, BN.from('15').mul(DECIMAL18))

        // add some vaETH at revenue splitter contract address
        await vaETH.connect(signer)['deposit()']({ value: BN.from('15').mul(DECIMAL18).toString() })
        const vaethAmount = BN.from('11').mul(DECIMAL18)
        await vaETH.connect(signer).transfer(psContract.address, vaethAmount.toString())

        // Check eth balance is > low level.
        const ethBalanceBefore = await ethers.provider.getBalance(VESPER_DEPLOYER)
        expect(ethBalanceBefore).to.be.gt(BN.from(low), 'eth balance is below low value')

        // VESPER_DEPLOYER has eth balance > low so top-up will be skipped.
        const vdVethBalanceBefore = await vaETH.balanceOf(VESPER_DEPLOYER)
        await psContract.connect(user6).topUp()
        const vdVethBalanceAfter = await vaETH.balanceOf(VESPER_DEPLOYER)

        expect(vdVethBalanceBefore).to.be.equal(vdVethBalanceAfter, 'Top-up should not change balance')
      })
    })

    context('Vesper Deployer Account top-up with vaUSDC token', function () {
      let payees, shares, psContract, vaUSDC
      const chainLinkUsdc2EthOracle = '0x986b5e1e1755e3c2440e960477f25201b0a8bbd4'

      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
        payees = [payee1.address, payee2.address]
        shares = [5, 95]
        psContract = await deployContract('RevenueSplitter', [payees, shares])
        vaUSDC = await ethers.getContractAt('IVesperPool', address.Vesper.vaUSDC)
        await psContract.addVToken(vaUSDC.address, chainLinkUsdc2EthOracle)
        await psContract.toggleAutoTopUp()
      })

      it('should top-up vesper deployer with vaUSDC token', async function () {
        // Keep 25 ether at VESPER_DEPLOYER
        const signer = await unlock(VESPER_DEPLOYER)
        await helpers.setBalance(VESPER_DEPLOYER, ethers.utils.parseEther('0'))
        await send(user6.address, VESPER_DEPLOYER, BN.from('10').mul(DECIMAL18))
        await send(user6.address, VESPER_DEPLOYER, BN.from('15').mul(DECIMAL18))
        const token = await vaUSDC.token()
        const usdc = await ethers.getContractAt('ERC20', token)

        // deposit 24 eth into vaUSDC pool
        const usdcForEth = await getEthQuote('24', token)
        await deposit(vaUSDC, usdc, usdcForEth, signer)
        const vausdcBal = await vaUSDC.balanceOf(signer.address)

        // Transfer vaUSDC balance to PS contract to bring VESPER_DEPLOYER balance < low level
        await vaUSDC.connect(signer).approve(psContract.address, vausdcBal)
        await vaUSDC.connect(signer).transfer(psContract.address, vausdcBal)

        // Set ETH balance to 0 for VESPER_DEPLOYER
        const vesperVusdcBalance = await vaUSDC.balanceOf(VESPER_DEPLOYER)
        await helpers.setBalance(VESPER_DEPLOYER, ethers.utils.parseEther('0'))
        expect(vesperVusdcBalance).to.be.equal(0, 'vaUSDC vesper deployer balance is not 0')
        expect(await ethers.provider.getBalance(VESPER_DEPLOYER)).to.be.equal(0, 'eth balance is not 0')

        // Check vaUSDC at revenue splitter contract address
        const psVusdcBalanceBefore = await vaUSDC.balanceOf(psContract.address)
        expect(psVusdcBalanceBefore).to.be.equal(vausdcBal, 'wrong vausdc amount')

        // Top-up vesper deployer
        await psContract.connect(user6).topUp()
        const vdVusdcBalanceAfter = await vaUSDC.balanceOf(VESPER_DEPLOYER)
        const psVusdcBalanceAfter = await vaUSDC.balanceOf(psContract.address)

        const perSharePrice = await vaUSDC.pricePerShare()

        // safe high levels to avoid any exchange/slippage loss.
        // keeping here a bit higher margins (2 eth) in case test executed with fork (older block number)
        const safeAboveHighLevel = BN.from(await getEthQuote('22', token))
          .mul(DECIMAL18)
          .div(perSharePrice)
        const safeUnderHighLevel = BN.from(await getEthQuote('18', token))
          .mul(DECIMAL18)
          .div(perSharePrice)

        expect(vdVusdcBalanceAfter).to.be.gte(safeUnderHighLevel, 'vesper deployer have < safe under high balance')
        expect(vdVusdcBalanceAfter).to.be.lte(safeAboveHighLevel, 'vesper deployer have > safe above high balance')
        expect(psVusdcBalanceBefore.sub(psVusdcBalanceAfter)).to.be.eq(
          vdVusdcBalanceAfter,
          'failed to top-up vesper deployer with usdc',
        )
      })
    })

    context('Only owner', function () {
      let payees, shares, psContract, vaUSDC, vaWBTC, vaETH
      const chainLinkUsdc2EthOracle = '0x986b5e1e1755e3c2440e960477f25201b0a8bbd4'
      const chainLinkBtc2EthOracle = '0xF7904a295A029a3aBDFFB6F12755974a958C7C25'
      beforeEach(async function () {
        ;[payee1, payee2, payee3, payer1, nonpayee1, user6] = await ethers.getSigners()
        payees = [payee1.address, payee2.address]
        shares = [5, 95]
        vaETH = await ethers.getContractAt('IVesperPool', address.Vesper.vaETH)
        vaWBTC = await ethers.getContractAt('IVesperPool', address.Vesper.vaWBTC)
        vaUSDC = await ethers.getContractAt('IVesperPool', address.Vesper.vaUSDC)
        psContract = await deployContract('RevenueSplitter', [payees, shares])
      })

      it('should allow to add vToken by owner', async function () {
        await expect(psContract.addVToken(vaETH.address, ZERO_ADDRESS)).not.to.be.reverted
        await expect(psContract.addVToken(vaWBTC.address, chainLinkBtc2EthOracle)).not.to.be.reverted
        await expect(psContract.addVToken(vaUSDC.address, chainLinkUsdc2EthOracle)).not.to.be.reverted
        expect(await psContract.vTokens([0])).to.be.equal(vaETH.address)
        expect(await psContract.vTokens([1])).to.be.equal(vaWBTC.address)
        expect(await psContract.vTokens([2])).to.be.equal(vaUSDC.address)
      })

      it('should not allow to add vToken if already present', async function () {
        await expect(psContract.addVToken(vaETH.address, ZERO_ADDRESS)).not.to.be.reverted
        await expect(psContract.addVToken(vaETH.address, ZERO_ADDRESS)).to.be.revertedWith('duplicate-vToken')
        await expect(psContract.addVToken(vaWBTC.address, chainLinkBtc2EthOracle)).not.to.be.reverted
        await expect(psContract.addVToken(vaWBTC.address, chainLinkBtc2EthOracle)).to.be.revertedWith(
          'duplicate-vToken',
        )
      })

      it('should not allow to add vToken with zero oracle address for non WETH pool', async function () {
        await expect(psContract.addVToken(vaWBTC.address, ZERO_ADDRESS)).to.be.revertedWith('oracle-is-zero-address')
        await expect(psContract.addVToken(vaUSDC.address, ZERO_ADDRESS)).to.be.revertedWith('oracle-is-zero-address')
      })

      it('should allow to add vToken with zero oracle address for WETH pool', async function () {
        await expect(psContract.addVToken(vaETH.address, ZERO_ADDRESS)).not.to.be.reverted
      })

      it('should not allow to add vToken with zero address', async function () {
        await expect(psContract.addVToken(ZERO_ADDRESS, ZERO_ADDRESS)).to.be.revertedWith('vToken-is-zero-address')
      })

      it('should not allow to add vToken using non owner', async function () {
        await expect(psContract.connect(user6).addVToken(vaETH.address, ZERO_ADDRESS)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        )
      })

      it('should allow to remove vToken by owner', async function () {
        await psContract.addVToken(vaETH.address, ZERO_ADDRESS)
        await psContract.addVToken(vaWBTC.address, chainLinkBtc2EthOracle)
        await psContract.addVToken(vaUSDC.address, chainLinkUsdc2EthOracle)

        await expect(psContract.removeVToken(vaWBTC.address)).not.to.be.reverted
        await expect(psContract.removeVToken(vaETH.address)).not.to.be.reverted
        await expect(psContract.removeVToken(vaUSDC.address)).not.to.be.reverted

        await expect(psContract.vTokens([0])).to.be.reverted
      })

      it('should allow to add, remove and add vToken', async function () {
        await psContract.addVToken(vaETH.address, ZERO_ADDRESS)
        await psContract.addVToken(vaWBTC.address, chainLinkBtc2EthOracle)
        await psContract.addVToken(vaUSDC.address, chainLinkUsdc2EthOracle)

        await expect(psContract.removeVToken(vaETH.address)).not.to.be.reverted
        await expect(psContract.addVToken(vaETH.address, ZERO_ADDRESS)).not.to.be.reverted
        await expect(psContract.removeVToken(vaUSDC.address)).not.to.be.reverted
        await expect(psContract.removeVToken(vaETH.address)).not.to.be.reverted
        await expect(psContract.addVToken(vaETH.address, ZERO_ADDRESS)).not.to.be.reverted
      })

      it('should not allow to remove vToken if not present', async function () {
        await expect(psContract.removeVToken(vaETH.address)).to.be.revertedWith('vToken-not-found')
        await expect(psContract.removeVToken(vaUSDC.address)).to.be.revertedWith('vToken-not-found')
        await psContract.addVToken(vaETH.address, ZERO_ADDRESS)
        await expect(psContract.removeVToken(vaETH.address)).not.to.be.reverted
        await expect(psContract.removeVToken(vaETH.address)).to.be.revertedWith('vToken-not-found')
      })

      it('should not allow to remove vToken with zero address', async function () {
        await expect(psContract.removeVToken(ZERO_ADDRESS)).to.be.revertedWith('vToken-is-zero-address')
      })

      it('should not allow to remove vToken using non owner', async function () {
        await expect(psContract.connect(user6).removeVToken(vaETH.address)).to.be.revertedWith(
          'Ownable: caller is not the owner',
        )
      })

      it('should toggle auto top-up to true', async function () {
        expect(await psContract.isAutoTopUpEnabled()).to.be.equal(false)
        expect(await psContract.isTopUpEnabled()).to.be.equal(false)

        await psContract.toggleAutoTopUp()

        expect(await psContract.isAutoTopUpEnabled()).to.be.equal(true)
        expect(await psContract.isTopUpEnabled()).to.be.equal(true)
      })

      it('should toggle auto top-up to false', async function () {
        // Set state to true
        await psContract.toggleAutoTopUp()
        // Set state to false
        await psContract.toggleAutoTopUp()
        // Disable auto top-up
        expect(await psContract.isAutoTopUpEnabled()).to.be.equal(false)
        // It should NOT disable top-up
        expect(await psContract.isTopUpEnabled()).to.be.equal(true)
      })

      it('should not allow auto top-up toggle via non owner', async function () {
        await expect(psContract.connect(user6).toggleAutoTopUp()).to.be.revertedWith('Ownable: caller is not the owner')
      })

      it('should toggle top-up status to true', async function () {
        expect(await psContract.isAutoTopUpEnabled()).to.be.equal(false)
        expect(await psContract.isTopUpEnabled()).to.be.equal(false)

        await psContract.toggleTopUpStatus()
        // It should NOT enable auto top-up
        expect(await psContract.isAutoTopUpEnabled()).to.be.equal(false)
        // Enable top-up
        expect(await psContract.isTopUpEnabled()).to.be.equal(true)
      })

      it('should toggle top-up status to false', async function () {
        // Toggle to true
        await psContract.toggleTopUpStatus()
        // Toggle to false
        await psContract.toggleTopUpStatus()

        // Disable auto top-up
        expect(await psContract.isAutoTopUpEnabled()).to.be.equal(false)
        // Disable top-up
        expect(await psContract.isTopUpEnabled()).to.be.equal(false)
      })
    })
  })
})
