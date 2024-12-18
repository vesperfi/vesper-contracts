// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "./AaveV3Xy.sol";
import "../../sommelier/SommelierBase.sol";
import "../../../interfaces/sommelier/ISommelier.sol";

/// @title Deposit Collateral in Aave and earn yield by depositing borrowed token in a Sommelier Vault.
contract AaveV3SommelierXy is AaveV3Xy, SommelierBase {
    using SafeERC20 for IERC20;

    constructor(
        address _pool,
        address _swapper,
        address _receiptToken,
        address _borrowToken,
        address _aaveAddressProvider,
        address _cellar,
        string memory _name
    ) AaveV3Xy(_pool, _swapper, _receiptToken, _borrowToken, _aaveAddressProvider, _name) SommelierBase(_cellar) {
        require(ICellar(_cellar).asset() == borrowToken, "invalid-sommelier-vault");
    }

    /// @dev After borrowing Y, deposit to Sommelier vault
    function _afterBorrowY(uint256 _amount) internal virtual override {
        _depositInSommelier(_amount);
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        IERC20(borrowToken).safeApprove(address(cellar), _amount);
    }

    /// @dev Before repaying Y, withdraw it from Sommelier vault

    function _beforeRepayY(uint256 _amount) internal virtual override {
        _withdrawY(_amount);
    }

    /// @notice Withdraw _shares proportional to collateral _amount from vPool
    function _withdrawY(uint256 _amount) internal virtual override {
        _withdrawFromSommelier(_amount);
    }

    /// @dev borrowToken balance here + borrowToken balance deposited in Sommelier vault
    function _getInvestedBorrowBalance() internal view virtual override returns (uint256) {
        return IERC20(borrowToken).balanceOf(address(this)) + _getAssetsInSommelier();
    }
}
