// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "../Strategy.sol";
import "../../interfaces/yearn/IYToken.sol";
import "../../interfaces/yearn/IStakingRewards.sol";

/// @title This strategy will deposit collateral token in a Yearn vault and stake receipt tokens
/// into staking contract to earn rewards and yield.
contract YearnStaking is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";
    IYToken internal immutable yToken;
    uint256 internal immutable yTokenDecimals;
    IStakingRewards public immutable stakingRewards;
    address public immutable rewardToken;
    IYToken internal immutable yTokenReward;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        address stakingRewards_,
        string memory name_
    ) Strategy(pool_, swapper_, receiptToken_) {
        require(receiptToken_ != address(0), "yToken-address-is-null");
        require(stakingRewards_ != address(0), "stakingRewards-address-is-null");
        yToken = IYToken(receiptToken_);
        yTokenDecimals = 10 ** yToken.decimals();
        stakingRewards = IStakingRewards(stakingRewards_);
        yTokenReward = IYToken(stakingRewards.rewardsToken());
        rewardToken = yTokenReward.token();
        NAME = name_;
    }

    function isReservedToken(address token_) public view virtual override returns (bool) {
        return token_ == address(yToken);
    }

    function tvl() external view override returns (uint256) {
        return _getCollateralFromYearn() + collateralToken.balanceOf(address(this));
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(yToken), amount_);
        IERC20(address(yToken)).safeApprove(address(stakingRewards), amount_);
        IERC20(rewardToken).safeApprove(address(swapper), amount_);
    }

    function _beforeMigration(address) internal override {
        // Unstake all staked tokens
        uint256 _stakedShares = stakingRewards.balanceOf(address(this));
        if (_stakedShares > 0) {
            stakingRewards.withdraw(_stakedShares);
        }
    }

    function _claimAndSwapRewards() internal override {
        // Claim reward and it will give us yToken as reward
        stakingRewards.getReward();
        uint256 _yRewardsAmount = yTokenReward.balanceOf(address(this));
        if (_yRewardsAmount > 0) {
            // Withdraw actual reward token from yToken
            yTokenReward.withdraw(_yRewardsAmount);
        }

        uint256 _rewardsAmount = IERC20(rewardToken).balanceOf(address(this));
        // Swap reward to collateral
        if (_rewardsAmount > 0 && rewardToken != address(collateralToken)) {
            _safeSwapExactInput(rewardToken, address(collateralToken), _rewardsAmount);
        }
    }

    function _convertToShares(uint256 collateralAmount_) internal view returns (uint256) {
        return (collateralAmount_ * yTokenDecimals) / yToken.pricePerShare();
    }

    function _getCollateralFromYearn() internal view returns (uint256) {
        return (_getTotalShares() * yToken.pricePerShare()) / yTokenDecimals;
    }

    function _getTotalShares() internal view returns (uint256) {
        return yToken.balanceOf(address(this)) + stakingRewards.balanceOf(address(this));
    }

    function _rebalance() internal override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _getCollateralFromYearn() + _collateralHere;

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
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);

        // strategy may get new fund. deposit to generate yield
        _collateralHere = collateralToken.balanceOf(address(this));
        if (_convertToShares(_collateralHere) > 0) {
            yToken.deposit(_collateralHere);
        }

        // Staking all yTokens to earn rewards
        uint256 _sharesHere = yToken.balanceOf(address(this));
        if (_sharesHere > 0) {
            stakingRewards.stake(_sharesHere);
        }
    }

    function _withdrawHere(uint256 amount_) internal override {
        // Check staked shares and shares here
        uint256 _sharesRequired = _convertToShares(amount_);
        uint256 _sharesHere = yToken.balanceOf(address(this));
        if (_sharesRequired > _sharesHere) {
            // Unstake minimum of staked and required
            uint256 _toUnstake = Math.min(stakingRewards.balanceOf(address(this)), (_sharesRequired - _sharesHere));
            if (_toUnstake > 0) {
                stakingRewards.withdraw(_toUnstake);
            }
        }

        // Withdraw all available yTokens. Reread balance as unstake will increase balance.
        _sharesHere = yToken.balanceOf(address(this));
        if (_sharesHere > 0) {
            yToken.withdraw(yToken.balanceOf(address(this)));
        }
    }
}
