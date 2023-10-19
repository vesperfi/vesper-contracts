// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./Morpho.sol";
import "../../interfaces/morpho/IMorpho.sol";

/// @title This strategy will deposit base asset i.e. USDC in Morpho and earn yield.
contract MorphoCompound is Morpho {
    using SafeERC20 for IERC20;

    address public immutable comp;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        address comp_,
        string memory name_
    ) Morpho(pool_, swapper_, receiptToken_, name_) {
        if (comp_ == address(0)) revert AddressIsNull();
        comp = comp_;
    }

    function isReservedToken(address token_) public view virtual override returns (bool) {
        return super.isReservedToken(token_) || token_ == comp;
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        IERC20(comp).safeApprove(address(swapper), amount_);
    }

    /// @dev claim COMP
    function _claimRewards() internal virtual override returns (address, uint256) {
        return (comp, ISupplyVaultCompound(address(supplyVault)).claimRewards(address(this)));
    }
}
