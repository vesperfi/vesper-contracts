// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../AlphaHomora.sol";
import "../../Earn.sol";

/// @title This strategy will deposit collateral token in Alpha Homora and earn drip in an another token.
contract AlphaHomoraEarn is AlphaHomora, Earn {
    using SafeERC20 for IERC20;

    // solhint-disable no-empty-blocks
    constructor(
        address pool_,
        address swapper_,
        address rewardToken_,
        address receiptToken_,
        address dripToken_,
        string memory name_
    ) AlphaHomora(pool_, swapper_, rewardToken_, receiptToken_, name_) Earn(dripToken_) {}

    /// @notice Approve all required tokens
    function _approveToken(uint256 amount_) internal override(Strategy, AlphaHomora) {
        AlphaHomora._approveToken(amount_);
        collateralToken.safeApprove(address(swapper), amount_);
    }

    function _claimRewards() internal override(AlphaHomora, Strategy) returns (address, uint256) {
        return AlphaHomora._claimRewards();
    }

    /**
     * @dev Generate report for pools accounting. Drip profit as rewards and send payback to pool.
     */
    function _rebalance()
        internal
        override(Strategy, AlphaHomora)
        returns (uint256 _profit, uint256 _loss, uint256 _payback)
    {
        (_profit, , _payback) = _generateReport();
        _handleProfit(_profit);
        _profit = 0;
        // Report 0 profit and 0 loss
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        // After reportEarning strategy may get more collateral from pool. Deposit those in Alpha.
        _deposit(collateralToken.balanceOf(address(this)));
    }
}
