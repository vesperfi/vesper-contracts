// SPDX-License-Identifier: MIT
/* solhint-disable */
pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEllipsisLp is IERC20 {
    function getReward() external;

    function rewardCount() external view returns (uint256);

    function rewardTokens(uint256) external view returns (address);
}
