'use strict'
const { ethers } = require('hardhat')

describe('Extra Finance', function () {
  it('Get reserveId', async function () {
    // Change collateral address and test will print reserveId for this collateral
    const collateral = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    const lendingPoolAddress = '0xbb505c54d71e9e599cb8435b4f0ceec05fc71cbd'
    const abi = [
      'function getUnderlyingTokenAddress(uint256) external view returns(address)',
      'function nextReserveId() external view returns(uint256)',
    ]
    const lendingPool = await ethers.getContractAt(abi, lendingPoolAddress)
    const len = await lendingPool.nextReserveId()
    for (let i = 0; i < len; i++) {
      const underlying = await lendingPool.getUnderlyingTokenAddress(i)
      if (underlying === collateral) {
        // eslint-disable-next-line no-console
        console.log('underlying: %s at %s', underlying, i)
      }
    }
  })
})
