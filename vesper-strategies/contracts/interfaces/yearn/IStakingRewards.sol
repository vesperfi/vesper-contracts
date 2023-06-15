// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface IStakingRewards {
    /// @notice The balance a given user has staked.
    function balanceOf(address account) external view returns (uint256);

    /// @notice Amount of reward token pending claim by an account.
    function earned(address account) external view returns (uint256);

    /// @notice The address of our rewards token.
    function rewardsToken() external view returns (address);

    /// @notice The total tokens staked in this contract.
    function totalSupply() external view returns (uint256);

    /// @notice Unstake all of the sender's tokens and claim any outstanding rewards.
    function exit() external;

    /// @notice Claim any earned reward tokens.
    /// @dev Can claim rewards even if no tokens still staked.
    function getReward() external;

    /// @notice Deposit vault tokens to the staking pool.
    /// @dev Can't stake zero.
    /// @param amount Amount of vault tokens to deposit.
    function stake(uint256 amount) external;

    /// @notice Withdraw vault tokens from the staking pool.
    /// @dev Can't withdraw zero. If trying to claim, call getReward() instead.
    /// @param amount Amount of vault tokens to withdraw.
    function withdraw(uint256 amount) external;
}
