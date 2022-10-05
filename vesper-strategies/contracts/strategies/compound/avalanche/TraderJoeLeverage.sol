// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./CompoundLikeLeverage.sol";
import "../../../interfaces/compound/IComptrollerMultiReward.sol";

// solhint-disable no-empty-blocks

/// @title This strategy will deposit collateral token in TraderJoe and based on position
/// it will borrow same collateral token. It will use borrowed asset as supply and borrow again.
contract TraderJoeLeverage is CompoundLikeLeverage {
    constructor(
        address _pool,
        address _swapManager,
        address _comptroller,
        address _rewardToken,
        address _aaveAddressProvider,
        address _receiptToken,
        string memory _name
    )
        CompoundLikeLeverage(
            _pool,
            _swapManager,
            _comptroller,
            _rewardToken,
            _aaveAddressProvider,
            _receiptToken,
            _name
        )
    {}

    /**
     * @dev Get Collateral Factor. TraderJoe has different return type for markets() call.
     */
    function _getCollateralFactor() internal view override returns (uint256 _collateralFactor) {
        (, _collateralFactor, ) = TraderJoeComptroller(address(comptroller)).markets(address(cToken));
        // Take 95% of collateralFactor to avoid any rounding issue.
        _collateralFactor = (_collateralFactor * COLLATERAL_FACTOR_LIMIT) / MAX_BPS;
    }
}
