// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Strategy.sol";
import "../../interfaces/wombat/IWombat.sol";

/// @title Deposit collateral into Wombat protocol and earn yield.
contract Wombat is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.0.0";

    IWombatPool public immutable wombatPool;
    IMasterWombat public immutable masterWombat;
    address[] public rewardTokens;

    uint256 public immutable wombatPoolId;
    /// @notice It is based on BPS scale where 10 = 0.1%
    uint256 public wombatSlippage;
    uint256 private constant MAX_BPS = 10_000;

    event WombatSlippageUpdated(uint256 oldSlippage, uint256 newSlippage);

    constructor(
        address pool_,
        address swapper_,
        IWombatPool wombatPool_,
        string memory name_
    ) Strategy(pool_, swapper_, address(0)) {
        require(address(wombatPool_) != address(0), "wombat-pool-is-null");

        // Get receiptToken aka LP token from wombat pool
        receiptToken = wombatPool_.addressOfAsset(address(collateralToken));

        // Get MasterWombat and poolId.
        masterWombat = IMasterWombat(wombatPool_.masterWombat());
        wombatPoolId = masterWombat.getAssetPid(receiptToken);

        // Get reward tokens for Wombat pool
        rewardTokens = _getRewardTokens();

        wombatPool = wombatPool_;
        wombatSlippage = 1; // 0.01% Slippage
        NAME = name_;
    }

    function getRewardTokens() external view returns (address[] memory) {
        return rewardTokens;
    }

    function getStakedLp() public view returns (uint256 _lpStaked) {
        // Get staked lp amount
        _lpStaked = masterWombat.userInfo(wombatPoolId, address(this)).amount;
    }

    function getTotalLp() public view returns (uint256 _lpAmount) {
        // totalLp = lp staked and lp here(if any)
        _lpAmount = getStakedLp() + _getLpHere();
    }

    function isReservedToken(address token_) public view virtual override returns (bool) {
        return token_ == receiptToken;
    }

    function tvl() external view override returns (uint256) {
        return _convertLpToCollateral(getTotalLp()) + collateralToken.balanceOf(address(this));
    }

    /// @dev Approve all required tokens
    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(wombatPool), amount_);
        IERC20(receiptToken).safeApprove(address(wombatPool), amount_);
        IERC20(receiptToken).safeApprove(address(masterWombat), amount_);
        uint256 _len = rewardTokens.length;
        for (uint256 i; i < _len; ++i) {
            IERC20(rewardTokens[i]).safeApprove(address(swapper), amount_);
        }
    }

    //solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address) internal virtual override {
        // Unstake all staked LP
        _unstakeLP(getStakedLp());
    }

    /// @notice Claim rewards and swap into collateral.
    function _claimAndSwapRewards() internal override {
        // Deposit 0 amount will trigger reward claim
        masterWombat.deposit(wombatPoolId, 0);
        uint256 _len = rewardTokens.length;
        for (uint256 i; i < _len; ++i) {
            address _rewardToken = rewardTokens[i];
            uint256 _rewardAmount = IERC20(_rewardToken).balanceOf(address(this));
            if (_rewardAmount > 0) {
                _safeSwapExactInput(_rewardToken, address(collateralToken), _rewardAmount);
            }
        }
    }

    function _convertCollateralToLp(uint256 collateralAmount_) internal view returns (uint256 _lpAmount) {
        (_lpAmount, ) = wombatPool.quotePotentialDeposit(address(collateralToken), collateralAmount_);
    }

    function _convertLpToCollateral(uint256 lpAmount_) internal view returns (uint256 collateralAmount_) {
        if (lpAmount_ > 0) {
            (collateralAmount_, ) = wombatPool.quotePotentialWithdraw(address(collateralToken), lpAmount_);
        }
    }

    /**
     * @dev Deposit collateral in Wombat.
     */
    function _deposit(uint256 amount_) internal virtual {
        if (amount_ > 0) {
            uint256 _expectedLp = _convertCollateralToLp(amount_);
            uint256 _minLp = _expectedLp - ((_expectedLp * wombatSlippage) / MAX_BPS);
            // Deposit collateral
            wombatPool.deposit(address(collateralToken), amount_, _minLp, address(this), block.timestamp, false);
        }

        // There may be some LP in contract even if there is no deposit above.
        uint256 _lpHere = _getLpHere();
        if (_lpHere > 0) {
            // Stake LP tokens
            masterWombat.deposit(wombatPoolId, _lpHere);
        }
    }

    function _getLpHere() internal view returns (uint256 _lpHere) {
        _lpHere = IERC20(receiptToken).balanceOf(address(this));
    }

    function _getRewardTokens() internal view returns (address[] memory _rewardTokens) {
        (address[] memory _bonusTokens, ) = masterWombat.rewarderBonusTokenInfo(wombatPoolId);
        uint256 _len = _bonusTokens.length;
        _rewardTokens = new address[](_len + 1);
        _rewardTokens[0] = masterWombat.wom();
        for (uint256 i; i < _len; ++i) {
            _rewardTokens[i + 1] = _bonusTokens[i];
        }
    }

    /**
     * @dev Generate report for pools accounting and also send profit and any payback to pool.
     */
    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
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

        // Submit earning report to pool
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        _deposit(collateralToken.balanceOf(address(this)));
    }

    function _unstakeLP(uint256 lpToUnstake_) internal {
        if (lpToUnstake_ > 0) {
            // Unstake required Lp
            masterWombat.withdraw(wombatPoolId, lpToUnstake_);
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

        // Minimum collateral acceptable in withdraw
        uint256 _minCollateral = _withdrawAmount - ((_withdrawAmount * wombatSlippage) / MAX_BPS);
        // Withdraw collateral.
        // There are scenarios where withdrawal of small amount can fail due to internal state of Wombat.
        // solhint-disable no-empty-blocks
        try
            wombatPool.withdraw(address(collateralToken), _lpRequired, _minCollateral, address(this), block.timestamp)
        {} catch {}
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    /// @notice Wombat protocol may have extra rewards and can be updated anytime.
    function refreshRewardTokens() external virtual onlyGovernor {
        // Claims all rewards, if any, before updating the reward list
        _claimAndSwapRewards();
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);
    }

    function updateWombatSlippage(uint256 newWombatSlippage_) external onlyGovernor {
        require(newWombatSlippage_ < MAX_BPS, "invalid-slippage-value");
        emit WombatSlippageUpdated(wombatSlippage, newWombatSlippage_);
        wombatSlippage = newWombatSlippage_;
    }
}
