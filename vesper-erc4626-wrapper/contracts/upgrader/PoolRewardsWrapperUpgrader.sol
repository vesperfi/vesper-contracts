// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./UpgraderBase.sol";

contract PoolRewardsWrapperUpgrader is UpgraderBase {
    constructor(address _owner) {
        transferOwnership(_owner);
    }

    /// @inheritdoc UpgraderBase
    function _calls() internal pure override returns (bytes[] memory _callsList) {
        _callsList = new bytes[](3);
        _callsList[0] = abi.encodeWithSignature("pool()");
        _callsList[1] = abi.encodeWithSignature("getRewardTokens()");
        _callsList[2] = abi.encodeWithSignature("rewardPerToken()");
    }
}
