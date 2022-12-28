// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./IFairLaunch.sol";

interface IConfig {
    function getFairLaunchAddr() external view returns (IFairLaunch);

    function getWrappedNativeAddr() external view returns (address);
}
