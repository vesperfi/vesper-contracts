// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/pool/PoolRewards.sol";

/// @title Distribute rewards based on vesper pool ERC4626 Wrapper balance and supply
/// @dev The main change is making this contract managed by the wrapper itself
contract VPoolERC4626WrapperRewards is PoolRewards {
    modifier onlyAuthorized() override {
        require(msg.sender == pool, "not-authorized");
        _;
    }
}
