// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./VenusVesperXy.sol";

// solhint-disable no-empty-blocks
/// @title Deposit BNB in Venus and earn interest by depositing borrowed token in a Vesper Pool.
contract VenusVesperXyBNB is VenusVesperXy {
    using SafeERC20 for IERC20;

    constructor(
        address pool_,
        address swapper_,
        address comptroller_,
        address rewardToken_,
        address receiptToken_,
        address borrowCToken_,
        address vPool_,
        string memory name_
    ) VenusVesperXy(pool_, swapper_, comptroller_, rewardToken_, receiptToken_, borrowCToken_, vPool_, name_) {}

    /// @dev Unwrap WBNB and supply in Venus
    function _mintX(uint256 _amount) internal override {
        if (_amount > 0) {
            WBNB.withdraw(_amount);
            supplyCToken.mint{value: _amount}();
        }
    }

    /// @dev Withdraw BNB from Venus and Wrap those as WBNB
    function _redeemX(uint256 _amount) internal override {
        super._redeemX(_amount);
        WBNB.deposit{value: address(this).balance}();
    }
}
