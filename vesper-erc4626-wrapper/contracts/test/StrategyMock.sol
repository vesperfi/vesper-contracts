// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";

contract StrategyMock {
    IVesperPool public pool;

    constructor(IVesperPool pool_) {
        pool = pool_;
    }

    function rebalance() external returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        pool.reportEarning(_profit, _loss, _payback);
    }

    function withdraw(uint256 amount_) external {
        IERC20 _token = IERC20(pool.token());
        uint256 _balance = _token.balanceOf(address(this));
        if (amount_ > _balance) {
            amount_ = _balance;
        }
        _token.transfer(msg.sender, amount_);
    }
}
