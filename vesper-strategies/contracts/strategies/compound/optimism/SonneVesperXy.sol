// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IPoolRewards.sol";
import "./../CompoundVesperXy.sol";
import "../../VesperRewards.sol";

// solhint-disable no-empty-blocks
/// @title Deposit Collateral in Sonne and earn interest by depositing borrowed token in a Vesper Pool.
contract SonneVesperXy is CompoundVesperXy {
    constructor(
        address _pool,
        address _swapper,
        address _comptroller,
        address _rewardToken,
        address _receiptToken,
        address _borrowCToken,
        address _vPool,
        string memory _name
    ) CompoundVesperXy(_pool, _swapper, _comptroller, _rewardToken, _receiptToken, _borrowCToken, _vPool, _name) {}
}
