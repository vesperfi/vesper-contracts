// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEToken is IERC20 {
    function balanceOfUnderlying(address account) external view returns (uint256);

    function totalSupplyUnderlying() external view returns (uint256);

    function deposit(uint256 subAccountId, uint256 amount) external;

    function withdraw(uint256 subAccountId, uint256 amount) external;
}

interface IEulerMarkers {
    function underlyingToEToken(address underlying) external view returns (address);
}
