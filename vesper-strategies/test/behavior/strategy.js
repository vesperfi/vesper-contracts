'use strict'

const hre = require('hardhat')
const ethers = hre.ethers
const { expect } = require('chai')
const { getEvent } = require('vesper-commons/utils/setup')
const { shouldMigrateStrategies } = require('./strategy-migration')
const { shouldBehaveLikeCompoundStrategy } = require('./compound')
const { shouldBehaveLikeCompoundXyStrategy } = require('./compound-xy')
const { shouldBehaveLikeCompoundLeverageStrategy } = require('./compound-leverage')
const { shouldBehaveLikeAaveLeverageStrategy } = require('./aave-leverage')
const { shouldBehaveLikeCrvStrategy } = require('./curve')
const { shouldBehaveLikeConvexStrategy } = require('./convex')
const { shouldBehaveLikeConvexForFraxStrategy } = require('./convex-for-frax')
const { shouldBehaveLikeMakerStrategy } = require('./maker')
const { shouldBehaveLikeEarnVesperStrategy } = require('./earn-vesper-strategy')
const { shouldBehaveLikeCompoundVesperXyStrategy } = require('./compound-vesper-xy')
const { shouldBehaveLikeAaveVesperXY } = require('./aave-vesper-xy')
const { shouldBehaveLikeEulerVesperXY } = require('./euler-vesper-xy')
const { shouldBehaveLikeAaveV3VesperXY } = require('./aavev3-vesper-xy')
const { shouldBehaveLikeEllipsisStrategy } = require('./ellipsis')
const { shouldBehaveLikeDotDotStrategy } = require('./dot-dot')
const { shouldBehaveLikeWombatStrategy } = require('./wombat')
const { shouldBehaveLikeAlpacaStrategy } = require('./alpaca')
const { shouldTestAlphaHomoraRewards } = require('./alpha-homora-rewards')
const { shouldTestStargateRewards } = require('./stargate-rewards')

const { deposit, makeStrategyProfitable } = require('vesper-commons/utils/poolOps')
const { mine } = require('@nomicfoundation/hardhat-network-helpers')
const StrategyType = require('vesper-commons/utils/strategyTypes')
const ZERO_ADDRESS = ethers.constants.AddressZero
function shouldBehaveLikeStrategy(index, type, strategyName) {
  let strategy, pool, feeCollector, collateralToken, accountant
  let owner, user1, user2, user3, user4, user5

  const behaviors = {
    [StrategyType.COMPOUND]: shouldBehaveLikeCompoundStrategy,
    [StrategyType.VESPER_MAKER]: shouldBehaveLikeMakerStrategy,
    [StrategyType.COMPOUND_VESPER_XY]: shouldBehaveLikeCompoundVesperXyStrategy,
    [StrategyType.COMPOUND_XY]: shouldBehaveLikeCompoundXyStrategy,
    [StrategyType.COMPOUND_LEVERAGE]: shouldBehaveLikeCompoundLeverageStrategy,
    [StrategyType.AAVE_LEVERAGE]: shouldBehaveLikeAaveLeverageStrategy,
    [StrategyType.AAVE_VESPER_XY]: shouldBehaveLikeAaveVesperXY,
    [StrategyType.CURVE]: shouldBehaveLikeCrvStrategy,
    [StrategyType.CONVEX]: shouldBehaveLikeConvexStrategy,
    [StrategyType.CONVEX_FOR_FRAX]: shouldBehaveLikeConvexForFraxStrategy,
    [StrategyType.EARN_VESPER]: shouldBehaveLikeEarnVesperStrategy,
    [StrategyType.EULER_VESPER_XY]: shouldBehaveLikeEulerVesperXY,
    [StrategyType.AAVE_V3_VESPER_XY]: shouldBehaveLikeAaveV3VesperXY,
    [StrategyType.ELLIPSIS]: shouldBehaveLikeEllipsisStrategy,
    [StrategyType.DOT_DOT]: shouldBehaveLikeDotDotStrategy,
    [StrategyType.WOMBAT]: shouldBehaveLikeWombatStrategy,
    [StrategyType.ALPACA]: shouldBehaveLikeAlpacaStrategy,
    [StrategyType.ALPHA_HOMORA]: shouldTestAlphaHomoraRewards,
    [StrategyType.STARGATE]: shouldTestStargateRewards,
  }

  const shouldBehaveLikeSpecificStrategy = behaviors[type]

  describe(`${strategyName} Strategy common behavior tests`, function () {
    let snapshotId
    beforeEach(async function () {
      snapshotId = await ethers.provider.send('evm_snapshot', [])
      ;[owner, user1, user2, user3, user4, user5] = this.users
      strategy = this.strategies[index].instance
      pool = this.pool
      accountant = this.accountant
      collateralToken = this.collateralToken
      feeCollector = this.strategies[index].feeCollector
    })
    afterEach(async function () {
      await ethers.provider.send('evm_revert', [snapshotId])
    })

    describe('Sweep token', function () {
      it('Should sweep erc20 token', async function () {
        const token = await (await ethers.getContractFactory('MockToken', owner)).deploy()
        const tokenBalance = ethers.utils.parseEther('10')
        await token.mint(strategy.address, tokenBalance)
        await strategy.sweep(token.address)
        const erc20BalanceFeeCollector = await token.balanceOf(feeCollector)
        expect(erc20BalanceFeeCollector).to.be.equal(tokenBalance, 'ERC20 token balance is wrong')
      })

      it('Should not sweep collateral token', async function () {
        await expect(strategy.sweep(collateralToken.address)).to.be.revertedWith('not-allowed-to-sweep-collateral')
      })

      it('Should not sweep reserved token', async function () {
        const reservedToken = await strategy.token()
        await expect(strategy.sweep(reservedToken)).to.be.revertedWith('not-allowed-to-sweep')
      })
    })

    describe('Keeper List', function () {
      it('Should add a new keeper', async function () {
        let keeperList = await strategy.keepers()
        expect(keeperList.length).to.be.equal(1, 'Owner present in keeper list')
        await strategy.addKeeper(user2.address)
        keeperList = await strategy.keepers()
        expect(keeperList.length).to.be.equal(2, 'Keeper added successfully')
      })

      it('Should revert if keeper address already exist in list', async function () {
        await strategy.addKeeper(user2.address)
        await expect(strategy.addKeeper(user2.address)).to.be.revertedWith('add-keeper-failed')
      })

      it('Should revert if non-gov user add a keeper', async function () {
        await expect(strategy.connect(user2).addKeeper(user3.address)).to.be.revertedWith('caller-is-not-the-governor')
      })

      it('Should remove a new keeper', async function () {
        await strategy.addKeeper(user2.address)
        await strategy.removeKeeper(user2.address)
        const keeperList = await strategy.keepers()
        expect(keeperList.length).to.be.equal(1, 'Keeper removed successfully')
      })

      it('Should revert if keeper address not exist in list', async function () {
        await expect(strategy.removeKeeper(user2.address)).to.be.revertedWith('remove-keeper-failed')
      })

      it('Should revert if non-gov user remove a keeper', async function () {
        await expect(strategy.connect(user2).removeKeeper(user3.address)).to.be.revertedWith(
          'caller-is-not-the-governor',
        )
      })
    })

    describe('Fee collector', function () {
      it('Should revert if fee collector is zero', async function () {
        await expect(strategy.updateFeeCollector(ZERO_ADDRESS)).to.be.revertedWith('fee-collector-address-is-zero')
      })

      it('Should revert if fee collector is same', async function () {
        await expect(strategy.updateFeeCollector(feeCollector)).to.be.revertedWith('fee-collector-is-same')
      })

      it('Should update fee collector', async function () {
        await expect(strategy.updateFeeCollector(user5.address))
          .to.emit(strategy, 'UpdatedFeeCollector')
          .withArgs(feeCollector, user5.address)
      })
    })

    describe('New strategy migration', function () {
      it('Should revert if caller is not vesper pool', async function () {
        const newStrategy = ethers.utils.getContractAddress({ from: user1.address, nonce: 100 })
        await expect(strategy.migrate(newStrategy)).to.be.revertedWith('caller-is-not-vesper-pool')
      })
    })

    describe('Rebalance', function () {
      it('Should revert if rebalance called from non keeper', async function () {
        await expect(strategy.connect(user4).rebalance()).to.be.revertedWith('caller-is-not-a-keeper')
      })

      it('Should generate profit after rebalance', async function () {
        await deposit(pool, collateralToken, '100', user1)
        const totalDebtBefore = await pool.totalDebtOf(strategy.address)
        expect(totalDebtBefore, 'Total debt should be zero').to.be.equal(0)
        await strategy.rebalance()
        await mine(50)
        // Generate profit
        await makeStrategyProfitable(strategy, collateralToken)
        const data = await strategy.callStatic.rebalance()
        if ((await pool.name()).includes('Earn')) {
          // Earn strategies don't generate profit
          expect(data._profit, 'Profit should be == 0').to.be.eq('0')
        } else {
          expect(data._profit, 'Profit should be > 0').to.be.gt('0')
        }
      })

      it('Should generate EarningReported event', async function () {
        await deposit(pool, collateralToken, '50', user2) // deposit 50 ETH to generate some profit
        await strategy.rebalance()
        await mine(50)
        const txnObj = await strategy.rebalance()
        const event = await getEvent(txnObj, accountant, 'EarningReported')
        // There may be more than 1 strategy, hence the gte. Bottom line we are testing event.
        expect(event.poolDebt, 'Should have same strategyDebt and poolDebt').to.gte(event.strategyDebt)
      })
    })

    describe('Tokens Reserved/Receipt', function () {
      it('Should get receipt token', async function () {
        expect(await strategy.token()).to.not.equal(ZERO_ADDRESS, 'Receipt token not found')
      })
      it('Should get receipt token not same as pool token', async function () {
        expect(await strategy.token()).to.not.equal(await pool.token(), 'Receipt token not same as pool token')
      })
      it('Should get strategy token as reserve token', async function () {
        expect(await strategy.isReservedToken(strategy.token())).to.be.equal(true, 'Strategy token is reserved')
      })
      it('Should not get other tokens as reserve token', async function () {
        const fakeToken = ethers.utils.getContractAddress({ from: user1.address, nonce: 200 })
        expect(await strategy.isReservedToken(fakeToken)).to.be.equal(false, 'Other token is not reserved')
      })
    })

    describe('Only pool can call withdraw', function () {
      it('Should not be able to withdraw from pool', async function () {
        await expect(strategy.withdraw(1)).to.be.revertedWith('caller-is-not-vesper-pool')
      })
    })

    describe('Approve token', function () {
      it('Should revert if called from non keeper', async function () {
        await expect(strategy.connect(user4).approveToken(0)).to.be.revertedWith('caller-is-not-a-keeper')
      })

      it('Should call approve tokens', async function () {
        // Test setup already calling approveToken so let's reset approval first.
        await strategy.approveToken(0)
        await expect(strategy.approveToken(ethers.constants.MaxUint256)).to.not.reverted
      })
    })
  })

  // Run strategy specific tets
  if (behaviors[type]) {
    shouldBehaveLikeSpecificStrategy(index)
  }
  shouldMigrateStrategies()
}

module.exports = { shouldBehaveLikeStrategy }
