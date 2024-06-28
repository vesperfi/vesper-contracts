// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import {IERC20} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMultiRewarder} from "./IMultiRewarder.sol";

interface IStargateStaking {
    /**
     * @notice Deposits `amount` of `token` into the pool. Informs the rewarder of the deposit, triggering a harvest.
     */
    function deposit(IERC20 token, uint256 amount) external;

    /// @notice Withdraws `amount` of `token` from the pool. Informs the rewarder of the withdrawal, triggers a harvest.
    function withdraw(IERC20 token, uint256 amount) external;

    /// @notice Withdraws `amount` of `token` from the pool in an always-working fashion. The rewarder is not informed.
    function emergencyWithdraw(IERC20 token) external;

    /// @notice Claims the rewards from the rewarder, and sends them to the caller.
    function claim(IERC20[] calldata lpTokens) external;

    /// @notice Returns the deposited balance of `user` in the pool of `token`.
    function balanceOf(IERC20 token, address user) external view returns (uint256);

    // @notice Returns the rewarder of the pool of `token`, responsible for distribution reward tokens.
    function rewarder(IERC20 token) external view returns (IMultiRewarder);
}
