// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Compound.sol";

// solhint-disable no-empty-blocks
/// @title This strategy will deposit collateral token in Venus and earn interest.
contract Venus is Compound {
    constructor(
        address pool_,
        address swapper_,
        address comptroller_,
        address rewardToken_,
        address receiptToken_,
        string memory name_
    ) Compound(pool_, swapper_, comptroller_, rewardToken_, receiptToken_, name_) {}

    /// @notice Claim Venus (XVS)
    function _claimRewards() internal override returns (address, uint256) {
        address[] memory _markets = new address[](1);
        _markets[0] = address(cToken);
        VenusComptroller(address(comptroller)).claimVenus(address(this), _markets);
        return (rewardToken, IERC20(rewardToken).balanceOf(address(this)));
    }
}
