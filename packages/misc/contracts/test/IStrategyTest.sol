// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface IStrategyTest {
    function pool() external view returns (address);

    function approveToken(uint256) external;

    function addKeeper(address keeper_) external;

    function claimAndSwapRewards(uint256) external returns (uint256 amountOut_);
}
