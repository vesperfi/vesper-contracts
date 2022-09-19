// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface TokenLike {
    function approve(address, uint256) external returns (bool);

    function balanceOf(address) external view returns (uint256);

    function deposit() external payable;

    function decimals() external view returns (uint256);

    function mint(address _recipient, uint256 _amount) external;

    function withdraw(uint256) external;

    function transfer(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);
}
