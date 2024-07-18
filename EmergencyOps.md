# Emergency Ops for Vesper Pools and Strategies

## Pool Ops
- Pause
  - Only pool `keeper` can call `pause()`
   - It will pause/stop deposits into the pool.
   - Withdraw will work as expected.
   - Keeper can call `unpause()` to revert the effects of `pause()`
- Shutdown
   - Only pool `keeper` can call `shutdown()`
   - It will stop deposit and withdraw from the pool
   - Keeper will have to call `open()` and `unpause()` to revert the effects of `shutdown()`

## Strategy Ops
- Rebalance
  - Only strategy `keeper` can call `rebalance()`.

- Migrate
    - Even though it is related to strategy, this process starts from the pool.
    - Only governor can call `migrateStrategy()` in the pool.
    - This process will migrate old strategy to new strategy. Both strategy should have same `strategy.token()`

- Update debtRatio
   - Only pool `maintainer` can call `updateDebtRatio()` in PoolAccountant.
   - In order to withdraw all from strategy, set debtRatio to zero and call `rebalance()`.
   - Only strategy `keeper` can call `rebalance()`.


## Role and Ops
- **Governor**: It is defined in Vesper pool and act as governor for the pool, poolAccountant and strategy contracts.
    | contract       | function                                   |
    | -------------- | ------------------------------------------ |
    | Pool           | migrateStrategy(address, address)          |
    | Pool           | updateMaximumProfitAsFee(uint256)          |
    | Pool           | updateMinimumDepositLimit(uint256)         |
    | Pool           | updatePoolRewards(address)                 |
    | Pool           | updateUniversalFee(uint256)                |
    | PoolAccountant | addStrategy(address, uint256, uint256)     |
    | PoolAccountant | removeStrategy(uint256)                    |
    | PoolAccountant | updateExternalDepositFee(address, uint256) |
    | Strategy       | addKeeper(address)                         |
    | Strategy       | removeKeeper(address)                      |
    | Strategy       | updateFeeCollector(address)                |
    | Strategy       | updateSwapper(address)                     |


- **Keeper**: Pool keepers can call methods in the pool and the poolAccountant contracts.
    | contract       | method                              |
    | -------------- | ----------------------------------- |
    | Pool           | pause()                             |
    | Pool           | unpause()                           |
    | Pool           | shutdown()                          |
    | Pool           | open()                              |
    | Pool           | addKeeper(address)                  |
    | Pool           | removeKeeper(address)               |
    | Pool           | addMaintainer(address)              |
    | Pool           | removeMaintainer(address)           |
    | Pool           | sweepERC20(address)                 |
    | PoolAccountant | recalculatePoolExternalDepositFee() |
    | PoolAccountant | sweep(address)                      |

- **Maintainer**: Pool maintainer can call methods in the poolAccountant contract.
    | contract       | method                           |
    | -------------- | -------------------------------- |
    | PoolAccountant | updateDebtRatio(address,uint256) |
    | PoolAccountant | updateWithdrawQueue(address[])   |

- Strategy **Keeper**: It can call methods in the strategy contract.
    | contract | method                             |
    | -------- | ---------------------------------- |
    | Strategy | approveToken(uint256)              |
    | Strategy | claimAndSwapRewards(uint256)       |
    | Strategy | rebalance()                        |
    | Strategy | swapToCollateral(address, uint256) |
    | Strategy | sweep(address)                     |