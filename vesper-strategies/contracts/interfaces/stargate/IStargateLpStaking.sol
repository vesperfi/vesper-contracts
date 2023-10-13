// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IStargateLpCore {
    function deposit(uint256 _pid, uint256 _amount) external;

    function withdraw(uint256 _pid, uint256 _amount) external;

    function userInfo(uint256 _pid, address _user) external view returns (uint256 _amount, uint256 _rewardDebt);
}

interface IStargateLpStaking is IStargateLpCore {
    function stargate() external view returns (address);

    function pendingStargate(uint256 _pid, address _user) external view returns (uint256);
}

interface IStargateLpStakingTime is IStargateLpCore {
    function eToken() external view returns (address);

    function pendingEmissionToken(uint256 _pid, address _user) external view returns (uint256);
}
