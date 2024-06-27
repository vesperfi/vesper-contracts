// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice A rewarder that can distribute multiple reward tokens (ERC20 and native) to `StargateStaking` pools.
interface IMultiRewarder {
    struct RewardDetails {
        uint256 rewardPerSec;
        uint160 totalAllocPoints;
        uint48 start;
        uint48 end;
        bool exists;
    }

    /**
     *  @notice Returns the reward pools linked to the `stakingToken` alongside the pending rewards for `user`
     *          for these pools.
     */
    function getRewards(IERC20 stakingToken, address user) external view returns (address[] memory, uint256[] memory);

    /// @notice Returns all enabled reward tokens. Stopped reward tokens are not included, while ended rewards are.
    function rewardTokens() external view returns (address[] memory);

    /// @notice Returns the emission details of a `rewardToken`, configured via `setReward`.
    function rewardDetails(address rewardToken) external view returns (RewardDetails memory);
}
