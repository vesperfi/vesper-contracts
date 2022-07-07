// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "../dependencies/openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestVSP is ERC20 {
    // solhint-disable-next-line no-empty-blocks
    constructor() ERC20("Vesper", "VSP") {}

    function mint(address _to, uint256 amount_) external {
        _mint(_to, amount_);
    }
}
