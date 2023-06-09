// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IPoolRewards.sol";
import "../../VesperRewards.sol";
import "./CompoundV3Xy.sol";

/// @title Deposit Collateral in Compound and earn interest by depositing borrowed token in a Vesper Pool.
contract CompoundV3VesperXy is CompoundV3Xy {
    using SafeERC20 for IERC20;

    // Destination Grow Pool for borrowed Token
    IVesperPool public immutable vPool;

    constructor(
        address pool_,
        address swapper_,
        address compRewards_,
        address rewardToken_,
        address comet_,
        address borrowToken_,
        address vPool_,
        string memory name_
    ) CompoundV3Xy(pool_, swapper_, compRewards_, rewardToken_, comet_, borrowToken_, name_) {
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
        VesperRewards._approveToken(vPool, swapper, amount_);
    }

    /// @dev Claim Compound and VSP rewards and convert to collateral token.
    function _claimAndSwapRewards() internal override {
        // Claim and swap Compound rewards
        CompoundV3Xy._claimAndSwapRewards();
        // Claim and swap rewards from Vesper
        VesperRewards._claimAndSwapRewards(vPool, swapper, address(collateralToken));
    }

    function _getYTokensInProtocol() internal view override returns (uint256) {
        return (vPool.pricePerShare() * vPool.balanceOf(address(this))) / 1e18;
    }

    /// @notice Withdraw _shares proportional to collateral _amount from vPool
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
