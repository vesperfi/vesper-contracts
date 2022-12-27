// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./AlphaHomoraEarn.sol";
import "vesper-pools/contracts/interfaces/token/IToken.sol";

/// @title Deposit native token in Alpha Homora and earn interest in another token.
contract AlphaHomoraEarnETH is AlphaHomoraEarn {
    address public immutable nativeToken;

    constructor(
        address pool_,
        address swapper_,
        address rewardToken_,
        address receiptToken_,
        address dripToken_,
        address nativeToken_,
        string memory name_
    ) AlphaHomoraEarn(pool_, swapper_, rewardToken_, receiptToken_, dripToken_, name_) {
        require(nativeToken_ != address(0), "native-token-is-null");
        nativeToken = nativeToken_;
    }

    receive() external payable {
        require((_msgSender() == address(safeBox)) || (_msgSender() == nativeToken), "invalid-sender");
    }

    /**
     * @dev This hook get called after collateral is withdrawn from AlphaHomora
     * Vesper support Wrapped native as collateral so convert native to wrapped native.
     */
    function _afterWithdrawal() internal override {
        TokenLike(nativeToken).deposit{value: address(this).balance}();
    }

    /**
     * @dev During deposit we have wrapped native but AlphaHomora accepts native token.
     * Withdraw native token from wrapped native before calling deposit in AlphaHomora.
     */
    function _deposit(uint256 amount_) internal override {
        if (amount_ > 0) {
            TokenLike(nativeToken).withdraw(amount_);
            safeBox.deposit{value: amount_}();
        }
    }

    function _setupCheck(address _pool) internal view override {
        require(address(IVesperPool(_pool).token()) == address(safeBox.weth()), "u-token-mismatch");
    }
}
