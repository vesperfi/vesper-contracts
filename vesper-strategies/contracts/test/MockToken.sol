// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Test Token", "TST") {}

    function mint(address _to, uint256 amount_) external {
        _mint(_to, amount_);
    }
}
