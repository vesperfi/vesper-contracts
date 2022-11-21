// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Strategy.sol";
import "./Alpaca.sol";

/// @title This strategy will deposit WBNB token in Alpaca and earn interest.
contract AlpacaBNB is Alpaca {
    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        address rewardToken_,
        uint256 poolId_,
        string memory name_
    ) Alpaca(pool_, swapper_, receiptToken_, rewardToken_, poolId_, name_) {
        require(receiptToken_ != address(0), "receipt-token-is-null");
        require(rewardToken_ != address(0), "reward-token-is-null");
        // Verify vault token is WBNB
        require(vault.token() == vault.config().getWrappedNativeAddr(), "collateral-mismatch");
    }

    receive() external payable {
        require((_msgSender() == address(vault)), "invalid-sender");
    }

    function _afterWithdrawal() internal override {
        // Alpaca will withdraw BNB if collateral is WBNB. So convert BNB into WBNB.
        TokenLike(address(collateralToken)).deposit{value: address(this).balance}();
    }
}
