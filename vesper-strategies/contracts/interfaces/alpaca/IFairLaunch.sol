// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface IFairLaunch {
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many Staking tokens the user has provided.
        uint256 rewardDebt; // Reward debt.
        uint256 bonusDebt; // Last block that user exec something to the pool.
        address fundedBy; // Funded by who?
    }

    /**
        @notice Get user info.
        @param _pid pool id
        @param _user Address to check info for
        @return _userInfo
     */
    function userInfo(uint256 _pid, address _user) external view returns (UserInfo memory _userInfo);

    function deposit(
        address _for,
        uint256 _pid,
        uint256 _amount
    ) external;

    function harvest(uint256 _pid) external;

    // View function to see pending ALPACAs on frontend.
    function pendingAlpaca(uint256 _pid, address _user) external view returns (uint256);

    function withdraw(
        address _for,
        uint256 _pid,
        uint256 _amount
    ) external;
}
