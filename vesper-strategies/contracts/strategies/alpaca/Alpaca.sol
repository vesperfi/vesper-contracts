// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Strategy.sol";
import "../../interfaces/alpaca/IVault.sol";
import "vesper-pools/contracts/interfaces/token/IToken.sol";

/// @title This strategy will deposit collateral token in Alpaca and earn interest.
contract Alpaca is Strategy {
    using SafeERC20 for IERC20;
    using SafeERC20 for IVault;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";

    IVault public immutable vault;
    IFairLaunch public immutable fairLaunch;
    address public immutable rewardToken;
    uint256 public immutable poolId;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        address rewardToken_,
        uint256 poolId_,
        string memory name_
    ) Strategy(pool_, swapper_, receiptToken_) {
        require(receiptToken_ != address(0), "receipt-token-is-null");
        require(rewardToken_ != address(0), "reward-token-is-null");

        vault = IVault(receiptToken_);
        require(vault.token() == address(collateralToken), "collateral-mismatch");
        fairLaunch = vault.config().getFairLaunchAddr();
        poolId = poolId_;
        rewardToken = rewardToken_;
        NAME = name_;
    }

    function getStakedLp() public view returns (uint256 _lpStaked) {
        // Get staked lp token amount
        _lpStaked = fairLaunch.userInfo(poolId, address(this)).amount;
    }

    function getTotalLp() public view returns (uint256 _lpAmount) {
        // totalLp = lp staked and lp here(if any)
        _lpAmount = getStakedLp() + _getLpHere();
    }

    function isReservedToken(address token_) public view override returns (bool) {
        return token_ == address(vault);
    }

    function tvl() external view override returns (uint256) {
        return _convertLpToCollateral(getTotalLp()) + collateralToken.balanceOf(address(this));
    }

    // solhint-disable no-empty-blocks
    function _afterWithdrawal() internal virtual {}

    function _approveToken(uint256 amount_) internal override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(vault), amount_);
        IERC20(rewardToken).safeApprove(address(swapper), amount_);
        vault.safeApprove(address(fairLaunch), amount_);
    }

    function _beforeMigration(address) internal override {
        _unstakeLP(getStakedLp());
    }

    function _claimRewards() internal override returns (address, uint256) {
        if (fairLaunch.pendingAlpaca(poolId, address(this)) > 0) {
            fairLaunch.harvest(poolId);
        }
        return (rewardToken, IERC20(rewardToken).balanceOf(address(this)));
    }

    /// @dev Converts a share amount in its relative collateral
    function _convertLpToCollateral(uint256 shares_) internal view returns (uint256 _assets) {
        if (shares_ > 0) {
            uint256 _totalSupply = vault.totalSupply();
            _assets = (_totalSupply > 0) ? (vault.totalToken() * shares_) / _totalSupply : 0;
        }
    }

    /// @dev Converts a collateral amount in its relative shares
    function _convertCollateralToLp(uint256 assets_) internal view returns (uint256 _shares) {
        if (assets_ > 0) {
            uint256 _totalToken = vault.totalToken();
            _shares = (_totalToken > 0) ? (assets_ * vault.totalSupply()) / _totalToken : 0;
        }
    }

    /// @notice Deposit collateral in Alpaca
    function _deposit(uint256 amount_) internal {
        if (amount_ > 0) {
            vault.deposit(amount_);
        }

        // There may be some LP in contract even if there is no deposit above.
        uint256 _lpHere = _getLpHere();
        if (_lpHere > 0) {
            // Stake LP tokens
            fairLaunch.deposit(address(this), poolId, _lpHere);
        }
    }

    function _getLpHere() internal view returns (uint256 _lpHere) {
        _lpHere = vault.balanceOf(address(this));
    }

    /**
     * @dev Generate report for pools accounting and report earning statement to pool.
     */
    function _rebalance() internal override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));

        uint256 _totalCollateral = _collateralHere + _convertLpToCollateral(getTotalLp());
        if (_totalCollateral > _totalDebt) {
            _profit = _totalCollateral - _totalDebt;
        } else {
            _loss = _totalDebt - _totalCollateral;
        }

        uint256 _profitAndExcessDebt = _profit + _excessDebt;
        if (_profitAndExcessDebt > _collateralHere) {
            _withdrawHere(_profitAndExcessDebt - _collateralHere);
            _collateralHere = collateralToken.balanceOf(address(this));
        }

        // Make sure _collateralHere >= _payback + profit. set actual payback first and then profit
        _payback = Math.min(_collateralHere, _excessDebt);
        _profit = _collateralHere > _payback ? Math.min((_collateralHere - _payback), _profit) : 0;
        // Report earning statement to pool
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        // After reportEarning strategy may get more collateral from pool. Deposit those.
        _deposit(collateralToken.balanceOf(address(this)));
    }

    function _unstakeLP(uint256 lpToUnstake_) internal {
        if (lpToUnstake_ > 0) {
            // Unstake required Lp
            fairLaunch.withdraw(address(this), poolId, lpToUnstake_);
        }
    }

    function _withdrawHere(uint256 amount_) internal override {
        // Withdrawable is minimum of requested amount_ and liquidity in protocol
        uint256 _withdrawAmount = Math.min(amount_, collateralToken.balanceOf(receiptToken));

        uint256 _lpRequired = _convertCollateralToLp(_withdrawAmount);

        uint256 _lpHere = _getLpHere();
        if (_lpRequired > _lpHere) {
            // Lp to unstake is minimum of LP needed and staked LP.
            _unstakeLP(Math.min((_lpRequired - _lpHere), getStakedLp()));
        }

        vault.withdraw(_getLpHere());
        _afterWithdrawal();
    }
}
