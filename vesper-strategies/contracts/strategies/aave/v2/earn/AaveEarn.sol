// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../AaveV2.sol";
import "../../../Earn.sol";

/// @title This strategy will deposit collateral token in Aave and earn drip in an another token.
contract AaveEarn is AaveV2, Earn {
    using SafeERC20 for IERC20;

    // solhint-disable no-empty-blocks
    constructor(
        address _pool,
        address _swapManager,
        address _receiptToken,
        address _dripToken,
        string memory _strategyName
    ) AaveV2(_pool, _swapManager, _receiptToken, _strategyName) Earn(_dripToken) {}

    // solhint-enable no-empty-blocks

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override(Strategy, AaveV2) {
        collateralToken.safeApprove(address(swapper), _amount);
        AaveV2._approveToken(_amount);
    }

    /// @dev Claim Aave rewards
    function _claimRewards() internal override(AaveV2, Strategy) returns (address, uint256) {
        return AaveV2._claimRewards();
    }

    /**
     * @dev Generate report for pools accounting. Drip profit as rewards and send payback to pool.
     */
    function _rebalance()
        internal
        override(Strategy, AaveV2)
        returns (uint256 _profit, uint256 _loss, uint256 _payback)
    {
        (_profit, , _payback) = _generateReport();
        _handleProfit(_profit);
        _profit = 0;
        // Report 0 profit and 0 loss
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        // After reportEarning strategy may get more collateral from pool. Deposit those in Aave.
        _deposit(address(collateralToken), collateralToken.balanceOf(address(this)));
    }
}
