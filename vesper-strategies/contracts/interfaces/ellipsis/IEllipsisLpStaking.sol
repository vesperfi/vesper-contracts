// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface IEllipsisLpStaking {
    // Info of each user.
    struct UserInfo {
        uint256 depositAmount; // The amount of tokens deposited into the contract.
        uint256 adjustedAmount; // The user's effective balance after boosting, used to calculate emission rates.
        uint256 rewardDebt;
        uint256 claimable;
    }

    /**
        @notice Get user info.
        @param _token LP token address
        @param _user Address to check info for
        @return _userInfo
     */
    function userInfo(address _token, address _user) external view returns (UserInfo memory _userInfo);

    /**
        @notice Claim pending rewards for one or more tokens for a user.
        @dev Also updates the claimer's boost.
        @param _user Address to claim rewards for. Reverts if the caller is not the
                     claimer and the claimer has blocked third-party actions.
        @param _tokens Array of LP token addresses to claim for.
        @return uint256 Claimed reward amount
     */
    function claim(address _user, address[] calldata _tokens) external returns (uint256);

    /**
        @notice Get the current number of unclaimed rewards for a user on one or more tokens
        @param _user User to query pending rewards for
        @param _tokens Array of token addresses to query
        @return uint256[] Unclaimed rewards
     */
    function claimableReward(address _user, address[] calldata _tokens) external view returns (uint256[] memory);

    /**
        @notice Deposit LP tokens into the contract
        @dev Also updates the receiver's current boost
        @param _token LP token address to deposit.
        @param _amount Amount of tokens to deposit.
        @param _claimRewards If true, also claim rewards earned on the token.
        @return uint256 Claimed reward amount
     */
    function deposit(
        address _token,
        uint256 _amount,
        bool _claimRewards
    ) external returns (uint256);

    /**
        @notice Withdraw LP tokens from the contract
        @dev Also updates the caller's current boost
        @param _token LP token address to withdraw.
        @param _amount Amount of tokens to withdraw.
        @param _claimRewards If true, also claim rewards earned on the token.
        @return uint256 Claimed reward amount
     */
    function withdraw(
        address _token,
        uint256 _amount,
        bool _claimRewards
    ) external returns (uint256);
}
