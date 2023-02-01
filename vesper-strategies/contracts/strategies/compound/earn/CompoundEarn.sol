// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Compound.sol";
import "../../Earn.sol";

/// @title This strategy will deposit collateral token in Compound and earn drip in an another token.
contract CompoundEarn is Compound, Earn {
    using SafeERC20 for IERC20;

    // solhint-disable no-empty-blocks
    constructor(
        address _pool,
        address _swapper,
        address _comptroller,
        address _rewardToken,
        address _receiptToken,
        address _dripToken,
        string memory _name
    ) Compound(_pool, _swapper, _comptroller, _rewardToken, _receiptToken, _name) Earn(_dripToken) {}

    // solhint-enable no-empty-blocks

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override(Strategy, Compound) {
        collateralToken.safeApprove(address(swapper), _amount);
        Compound._approveToken(_amount);
    }

    function _claimRewards() internal override(Compound, Strategy) returns (address, uint256) {
        return Compound._claimRewards();
    }

    /**
     * @dev Generate report for pools accounting. Drip profit as rewards and send payback to pool.
     */
    function _rebalance()
        internal
        override(Strategy, Compound)
        returns (uint256 _profit, uint256 _loss, uint256 _payback)
    {
        (_profit, , _payback) = _generateReport();
        _handleProfit(_profit);
        _profit = 0;
        // Report 0 profit and 0 loss
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        // After reportEarning strategy may get more collateral from pool. Deposit those in Compound.
        _deposit(collateralToken.balanceOf(address(this)));
    }
}
