// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Compound.sol";

// solhint-disable no-empty-blocks
/// @title This strategy will deposit collateral token in Sonne and earn interest.
contract Sonne is Compound {
    constructor(
        address pool_,
        address swapper_,
        address comptroller_,
        address rewardToken_,
        address receiptToken_,
        string memory name_
    ) Compound(pool_, swapper_, comptroller_, rewardToken_, receiptToken_, name_) {}
}
