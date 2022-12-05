// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./Euler.sol";
import "../../interfaces/external/lido/IWstETH.sol";

/// @title This strategy will deposit wstETH in Euler and earn interest.
/* solhint-disable no-empty-blocks */
contract EulerSTETH is Euler {
    using SafeERC20 for IERC20;

    IWstETH internal constant WSTETH = IWstETH(0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0);

    constructor(
        address pool_,
        address swapper_,
        address euler_,
        address eulerMarkets_,
        string memory name_
    ) Euler(pool_, swapper_, euler_, eulerMarkets_, name_) {}

    function _approveToken(uint256 amount_) internal virtual override {
        Strategy._approveToken(amount_);
        collateralToken.safeApprove(address(WSTETH), amount_);
        IERC20(WSTETH).safeApprove(euler, amount_);
    }

    function _fetchReceiptToken(address eulerMarkets_) internal view override returns (address) {
        return IEulerMarkets(eulerMarkets_).underlyingToEToken(address(WSTETH));
    }

    function _getWrappedAmount(uint256 unwrappedAmount_) internal view override returns (uint256) {
        return WSTETH.getWstETHByStETH(unwrappedAmount_);
    }

    function _getUnwrappedAmount(uint256 wrappedAmount_) internal view override returns (uint256) {
        return WSTETH.getStETHByWstETH(wrappedAmount_);
    }

    function _unwrap(uint256 wrappedAmount_) internal override returns (uint256) {
        return WSTETH.unwrap(wrappedAmount_);
    }

    function _wrap(uint256 unwrappedAmount_) internal override returns (uint256) {
        return WSTETH.wrap(unwrappedAmount_);
    }
}
