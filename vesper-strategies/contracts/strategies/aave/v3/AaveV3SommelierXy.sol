// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "./AaveV3Xy.sol";
import "../../sommelier/SommelierBase.sol";
import "../../../interfaces/sommelier/ISommelier.sol";

/// @title Deposit Collateral in Aave and earn interest by depositing borrowed token in a Vesper Pool.
contract AaveV3VSommelierXy is AaveV3Xy, SommelierBase {
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

    /// @notice After borrowing Y, deposit to Vesper Pool
    function _afterBorrowY(uint256 _amount) internal virtual override {
        _depositInSommelier(_amount);
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        IERC20(borrowToken).safeApprove(address(cellar), _amount);
    }

    /// @notice Before repaying Y, withdraw it from Vesper Pool
    function _beforeRepayY(uint256 _amount) internal virtual override {
        _withdrawFromSommelier(_amount);
    }

    /// @dev Claim all rewards and convert to collateral.
    function _claimAndSwapRewards() internal override {
        // Claim rewards from Aave
        AaveV3Xy._claimAndSwapRewards();
    }

    /// @notice Borrowed Y balance deposited in Vesper Pool
    function _getInvestedBorrowBalance() internal view virtual override returns (uint256) {
        return _getAssetsInSommelier();
    }

    /// @notice Swap excess borrow for more wrappedCollateral when underlying vPool is making profits
    function _rebalanceBorrow(uint256 _excessBorrow) internal virtual override {
        if (_excessBorrow > 0) {
            _withdrawFromSommelier(_excessBorrow);
            uint256 _borrowedHere = IERC20(borrowToken).balanceOf(address(this));
            if (_borrowedHere > 0) {
                _safeSwapExactInput(borrowToken, address(wrappedCollateral), _borrowedHere);
            }
        }
    }
}
