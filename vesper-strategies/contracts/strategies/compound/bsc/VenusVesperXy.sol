// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IPoolRewards.sol";
import "./VenusXy.sol";

/// @title Deposit Collateral in Venus and earn interest by depositing borrowed token in a Vesper Pool.
contract VenusVesperXy is VenusXy {
    using SafeERC20 for IERC20;

    // Destination Grow Pool for borrowed Token
    IVesperPool public immutable vPool;

    constructor(
        address pool_,
        address swapper_,
        address comptroller_,
        address rewardToken_,
        address receiptToken_,
        address borrowCToken_,
        address vPool_,
        string memory name_
    ) VenusXy(pool_, swapper_, comptroller_, rewardToken_, receiptToken_, borrowCToken_, name_) {
        require(address(IVesperPool(vPool_).token()) == borrowToken, "invalid-grow-pool");
        vPool = IVesperPool(vPool_);
    }

    /// @notice Gets amount of borrowed Y collateral in strategy + Y collateral amount deposited in vPool
    function borrowBalance() external view returns (uint256) {
        return IERC20(borrowToken).balanceOf(address(this)) + _getYTokensInProtocol();
    }

    function isReservedToken(address token_) public view virtual override returns (bool) {
        return super.isReservedToken(token_) || token_ == address(vPool);
    }

    /// @notice After borrowing Y, deposit to Vesper Pool
    function _afterBorrowY(uint256 amount_) internal override {
        vPool.deposit(amount_);
    }

    function _approveToken(uint256 amount_) internal override {
        super._approveToken(amount_);
        IERC20(borrowToken).safeApprove(address(vPool), amount_);
    }

    /// @notice Before repaying Y, withdraw it from Vesper Pool
    function _beforeRepayY(uint256 amount_) internal override {
        _withdrawY(amount_);
    }

    function _getYTokensInProtocol() internal view override returns (uint256) {
        return (vPool.pricePerShare() * vPool.balanceOf(address(this))) / 1e18;
    }

    /// @notice Withdraw _shares proportional to collateral amount_ from vPool
    function _withdrawY(uint256 amount_) internal override {
        uint256 _pricePerShare = vPool.pricePerShare();
        uint256 _shares = (amount_ * 1e18) / _pricePerShare;
        _shares = amount_ > ((_shares * _pricePerShare) / 1e18) ? _shares + 1 : _shares;
        uint256 _maxShares = vPool.balanceOf(address(this));
        _shares = _shares > _maxShares ? _maxShares : _shares;
        if (_shares > 0) {
            vPool.withdraw(_shares);
        }
    }
}
