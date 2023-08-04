// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./UpgraderBase.sol";

contract VPoolWrapperUpgrader is UpgraderBase {
    constructor(address _owner) {
        transferOwnership(_owner);
    }

    /// @inheritdoc UpgraderBase
    function _calls() internal pure override returns (bytes[] memory _callsList) {
        _callsList = new bytes[](4);
        _callsList[0] = abi.encodeWithSignature("vToken()");
        _callsList[1] = abi.encodeWithSignature("wrapperRewards()");
        _callsList[2] = abi.encodeWithSignature("asset()");
        _callsList[3] = abi.encodeWithSignature("totalAssets()");
    }
}
