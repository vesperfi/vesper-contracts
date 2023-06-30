// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../../../interfaces/external/lido/IWstETH.sol";
import "./AaveV3VesperXy.sol";

/// @title Deposit wstETH in Aave and earn yield by depositing borrowed token in a Vesper Pool.
contract AaveV3VesperStETH is AaveV3VesperXy {
    using SafeERC20 for IERC20;

    IWstETH internal constant WSTETH = IWstETH(0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0);

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        address borrowToken_,
        address aaveAddressProvider_,
        address vPool_,
        string memory name_
    ) AaveV3VesperXy(pool_, swapper_, receiptToken_, borrowToken_, aaveAddressProvider_, vPool_, name_) {}

    /// @notice Returns total collateral locked in the strategy
    function tvl() external view virtual override returns (uint256) {
        // receiptToken is aToken. aToken is 1:1 of collateral token
        return
            IERC20(receiptToken).balanceOf(address(this)) +
            wrappedCollateral.balanceOf(address(this)) +
            _convertToWrapped(collateralToken.balanceOf(address(this)));
    }

    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(wrappedCollateral), amount_);
    }

    function _calculateUnwrapped(uint256 wrappedAmount_) internal view override returns (uint256) {
        return WSTETH.getStETHByWstETH(wrappedAmount_);
    }

    function _calculateWrapped(uint256 unwrappedAmount_) internal view override returns (uint256) {
        return WSTETH.getWstETHByStETH(unwrappedAmount_);
    }

    function _getCollateralHere() internal virtual override returns (uint256) {
        uint256 _wrapped = wrappedCollateral.balanceOf(address(this));
        if (_wrapped > 0) {
            _unwrap(_wrapped);
        }
        // Return unwrapped balance
        return collateralToken.balanceOf(address(this));
    }

    function _getWrappedToken(IERC20) internal pure override returns (IERC20) {
        return IERC20(address(WSTETH));
    }

    function _unwrap(uint256 wrappedAmount_) internal override returns (uint256) {
        return WSTETH.unwrap(wrappedAmount_);
    }

    function _wrap(uint256 unwrappedAmount_) internal override returns (uint256) {
        return WSTETH.wrap(unwrappedAmount_);
    }
}
