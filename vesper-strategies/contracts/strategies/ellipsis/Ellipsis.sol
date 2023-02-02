// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/utils/math/SafeCast.sol";
import "../../interfaces/curve/IDepositZap.sol";
import "../../interfaces/curve/IStableSwap.sol";
import "../../interfaces/curve/IAddressProvider.sol";
import "../../interfaces/one-oracle/IMasterOracle.sol";
import "../../interfaces/ellipsis/IEllipsisLp.sol";
import "../../interfaces/ellipsis/IEllipsisLpStaking.sol";
import "../../interfaces/ellipsis/IEllipsisRegistry.sol";
import "../Strategy.sol";

/// @title This strategy will deposit collateral token in a Ellipsis Pool and earn interest.
contract Ellipsis is Strategy {
    using SafeERC20 for IERC20;
    using SafeERC20 for IEllipsisLp;

    enum PoolType {
        PLAIN_2_POOL,
        PLAIN_3_POOL,
        META_4_POOL
    }

    string public constant VERSION = "5.1.0";

    uint256 internal constant MAX_BPS = 10_000;
    IAddressProvider public constant ADDRESS_PROVIDER = IAddressProvider(0x31D236483A15F9B9dD60b36D4013D75e9dbF852b);
    IEllipsisLpStaking public constant LP_STAKING = IEllipsisLpStaking(0x5B74C99AA2356B4eAa7B85dC486843eDff8Dfdbe);
    address internal constant EPX = 0xAf41054C1487b0e5E2B9250C0332eCBCe6CE9d71;

    IEllipsisLp internal immutable ellipsisLp; // Note: Same as `receiptToken` but using this in order to save gas since it's `immutable` and `receiptToken` isn't
    address public immutable ellipsisPool;

    uint256 public immutable collateralIdx;
    address internal immutable depositZap;
    PoolType public immutable ellipsisPoolType;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    uint256 public ellipsisSlippage;
    IMasterOracle public masterOracle;
    address[] public rewardTokens;

    event EllipsisSlippageUpdated(uint256 oldSlippage, uint256 newSlippage);
    event MasterOracleUpdated(IMasterOracle oldMasterOracle, IMasterOracle newMasterOracle);

    constructor(
        address pool_,
        address ellipsisPool_,
        PoolType ellipsisPoolType_,
        address depositZap_,
        uint256 ellipsisSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    ) Strategy(pool_, swapper_, address(0)) {
        require(ellipsisPool_ != address(0), "pool-is-null");

        IEllipsisRegistry _registry = IEllipsisRegistry(ADDRESS_PROVIDER.get_registry());

        address _ellipsisLp = _registry.get_lp_token(ellipsisPool_);
        require(collateralIdx_ < _registry.get_n_coins(ellipsisPool_), "invalid-collateral");
        require(
            _registry.get_underlying_coins(ellipsisPool_)[collateralIdx_] == address(collateralToken),
            "collateral-mismatch"
        );

        require(_ellipsisLp != address(0), "lp-is-null");

        ellipsisPool = ellipsisPool_;
        ellipsisLp = IEllipsisLp(_ellipsisLp);

        ellipsisSlippage = ellipsisSlippage_;
        receiptToken = _ellipsisLp;
        collateralIdx = collateralIdx_;
        ellipsisPoolType = ellipsisPoolType_;
        depositZap = depositZap_;
        masterOracle = IMasterOracle(masterOracle_);
        rewardTokens = Ellipsis._getRewardTokens();
        NAME = name_;
    }

    /// @dev Check whether given token is reserved or not. Reserved tokens are not allowed to sweep.
    function isReservedToken(address token_) public view override returns (bool) {
        return token_ == address(ellipsisLp) || token_ == address(collateralToken);
    }

    // Gets LP value not staked in gauge
    function lpBalanceHere() public view virtual returns (uint256 _lpHere) {
        _lpHere = ellipsisLp.balanceOf(address(this));
    }

    function lpBalanceHereAndStaked() public view virtual returns (uint256 _lpHereAndStaked) {
        _lpHereAndStaked = ellipsisLp.balanceOf(address(this)) + lpBalanceStaked();
    }

    function lpBalanceStaked() public view virtual returns (uint256 _lpStaked) {
        _lpStaked = LP_STAKING.userInfo(address(ellipsisLp), address(this)).depositAmount;
    }

    /// @notice Returns collateral balance + collateral deposited to Ellipsis
    function tvl() external view override returns (uint256) {
        return
            collateralToken.balanceOf(address(this)) +
            _quoteLpToCoin(lpBalanceHereAndStaked(), SafeCast.toInt128(int256(collateralIdx)));
    }

    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);

        address _swapper = address(swapper);

        collateralToken.safeApprove(ellipsisPool, amount_);
        collateralToken.safeApprove(_swapper, amount_);

        uint256 _rewardTokensLength = rewardTokens.length;
        for (uint256 i; i < _rewardTokensLength; ++i) {
            IERC20(rewardTokens[i]).safeApprove(_swapper, amount_);
        }
        ellipsisLp.safeApprove(address(LP_STAKING), amount_);

        if (depositZap != address(0)) {
            collateralToken.safeApprove(depositZap, amount_);
            ellipsisLp.safeApprove(depositZap, amount_);
        }
    }

    /// @notice Unstake LP tokens in order to transfer to the new strategy
    function _beforeMigration(address newStrategy_) internal override {
        require(IStrategy(newStrategy_).collateral() == address(collateralToken), "wrong-collateral-token");
        require(IStrategy(newStrategy_).token() == address(ellipsisLp), "wrong-receipt-token");
        _unstakeAllLp();
    }

    function _calculateAmountOutMin(
        address tokenIn_,
        address tokenOut_,
        uint256 amountIn_
    ) private view returns (uint256 _amountOutMin) {
        _amountOutMin = (masterOracle.quote(tokenIn_, tokenOut_, amountIn_) * (MAX_BPS - ellipsisSlippage)) / MAX_BPS;
    }

    /**
     * @dev Ellipsis pool may have more than one reward token.
     */
    function _claimAndSwapRewards() internal override {
        _claimRewards();
        uint256 _rewardTokensLength = rewardTokens.length;
        for (uint256 i; i < _rewardTokensLength; ++i) {
            address _rewardToken = rewardTokens[i];
            uint256 _amountIn = IERC20(_rewardToken).balanceOf(address(this));
            if (_amountIn > 0) {
                _safeSwapExactInput(_rewardToken, address(collateralToken), _amountIn);
            }
        }
    }

    /// @dev Return values are not being used hence returning 0
    function _claimRewards() internal virtual override returns (address, uint256) {
        address[] memory _tokens = new address[](1);
        _tokens[0] = address(ellipsisLp);
        LP_STAKING.claim(address(this), _tokens);
        // At preset Ellipsis either reward EPX via staking or reward VALAS via LP contract along with EPX.
        if (rewardTokens.length > 1) {
            ellipsisLp.getReward();
        }
        return (address(0), 0);
    }

    function _deposit() internal {
        _depositToEllipsis(collateralToken.balanceOf(address(this)));
        _stakeAllLp();
    }

    function _depositTo2PlainPool(uint256 coinAmountIn_, uint256 lpAmountOutMin_) private {
        uint256[2] memory _depositAmounts;
        _depositAmounts[collateralIdx] = coinAmountIn_;
        IStableSwap2x(ellipsisPool).add_liquidity(_depositAmounts, lpAmountOutMin_);
    }

    function _depositTo3PlainPool(uint256 coinAmountIn_, uint256 lpAmountOutMin_) private {
        uint256[3] memory _depositAmounts;
        _depositAmounts[collateralIdx] = coinAmountIn_;
        IStableSwap3x(ellipsisPool).add_liquidity(_depositAmounts, lpAmountOutMin_);
    }

    function _depositTo4FactoryMetaPool(uint256 coinAmountIn_, uint256 lpAmountOutMin_) private {
        uint256[4] memory _depositAmounts;
        _depositAmounts[collateralIdx] = coinAmountIn_;
        // Note: The function below won't return a reason when reverting due to slippage
        IDepositZap4x(depositZap).add_liquidity(address(ellipsisPool), _depositAmounts, lpAmountOutMin_);
    }

    function _depositToEllipsis(uint256 coinAmountIn_) private {
        if (coinAmountIn_ == 0) {
            return;
        }

        uint256 _lpAmountOutMin = _calculateAmountOutMin(address(collateralToken), address(ellipsisLp), coinAmountIn_);

        if (ellipsisPoolType == PoolType.PLAIN_2_POOL) {
            return _depositTo2PlainPool(coinAmountIn_, _lpAmountOutMin);
        }
        if (ellipsisPoolType == PoolType.PLAIN_3_POOL) {
            return _depositTo3PlainPool(coinAmountIn_, _lpAmountOutMin);
        }

        if (ellipsisPoolType == PoolType.META_4_POOL) {
            return _depositTo4FactoryMetaPool(coinAmountIn_, _lpAmountOutMin);
        }

        revert("deposit-to-ellipsis-failed");
    }

    function _generateReport() internal virtual returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _strategyDebt = IVesperPool(pool).totalDebtOf(address(this));

        int128 _i = SafeCast.toInt128(int256(collateralIdx));
        uint256 _lpHere = lpBalanceHere();
        uint256 _totalLp = _lpHere + lpBalanceStaked();
        uint256 _collateralInEllipsis = _quoteLpToCoin(_totalLp, _i);
        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _collateralHere + _collateralInEllipsis;

        if (_totalCollateral > _strategyDebt) {
            _profit = _totalCollateral - _strategyDebt;
        } else {
            _loss = _strategyDebt - _totalCollateral;
        }

        uint256 _profitAndExcessDebt = _profit + _excessDebt;
        if (_profitAndExcessDebt > _collateralHere) {
            uint256 _totalAmountToWithdraw = Math.min((_profitAndExcessDebt - _collateralHere), _collateralInEllipsis);
            if (_totalAmountToWithdraw > 0) {
                uint256 _lpToBurn = Math.min((_totalAmountToWithdraw * _totalLp) / _collateralInEllipsis, _totalLp);

                if (_lpToBurn > 0) {
                    if (_lpToBurn > _lpHere) {
                        _unstakeLp(_lpToBurn - _lpHere);
                    }

                    _withdrawFromEllipsis(_lpToBurn, _i);

                    _collateralHere = collateralToken.balanceOf(address(this));
                }
            }
        }

        // Make sure _collateralHere >= _payback + profit. set actual payback first and then profit
        _payback = Math.min(_collateralHere, _excessDebt);
        _profit = _collateralHere > _payback ? Math.min((_collateralHere - _payback), _profit) : 0;
    }

    /**
     * @dev Prepare rewardToken array
     * @return _rewardTokens The array of reward tokens (both base and extra rewards)
     */
    function _getRewardTokens() internal view virtual returns (address[] memory _rewardTokens) {
        try ellipsisLp.rewardCount() returns (uint256 _len) {
            // Meta and Factory pools
            _rewardTokens = new address[](1 + _len);
            _rewardTokens[0] = EPX;
            for (uint256 i; i < _len; ++i) {
                _rewardTokens[i + 1] = ellipsisLp.rewardTokens(i);
            }
            return _rewardTokens;
        } catch {
            // Base pools
            _rewardTokens = new address[](1);
            _rewardTokens[0] = EPX;
            return _rewardTokens;
        }
    }

    function _quoteLpToCoin(uint256 amountIn_, int128 toIdx_) private view returns (uint256 _amountOut) {
        if (amountIn_ == 0) {
            return 0;
        }

        if (ellipsisPoolType == PoolType.META_4_POOL) {
            return IDepositZap4x(depositZap).calc_withdraw_one_coin(address(ellipsisLp), amountIn_, toIdx_);
        }

        return IStableSwap(ellipsisPool).calc_withdraw_one_coin(amountIn_, toIdx_);
    }

    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        (_profit, _loss, _payback) = _generateReport();
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        _deposit();
    }

    // Requires that ellipsisLpStaking has approval for lp token
    function _stakeAllLp() internal virtual {
        uint256 _balance = ellipsisLp.balanceOf(address(this));
        if (_balance > 0) {
            LP_STAKING.deposit(address(ellipsisLp), _balance, false);
        }
    }

    function _unstakeAllLp() internal virtual {
        _unstakeLp(lpBalanceStaked());
    }

    function _unstakeLp(uint256 amount_) internal virtual {
        if (amount_ > 0) {
            LP_STAKING.withdraw(address(ellipsisLp), amount_, false);
        }
    }

    function _withdrawFromPlainPool(uint256 lpAmount_, uint256 minAmountOut_, int128 i_) private {
        IStableSwap(ellipsisPool).remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_);
    }

    function _withdrawFrom4FactoryMetaPool(uint256 lpAmount_, uint256 minAmountOut_, int128 i_) private {
        // Note: The function below won't return a reason when reverting due to slippage
        IDepositZap4x(depositZap).remove_liquidity_one_coin(address(ellipsisLp), lpAmount_, i_, minAmountOut_);
    }

    function _withdrawFromEllipsis(uint256 lpToBurn_, int128 coinIdx_) internal {
        if (lpToBurn_ == 0) {
            return;
        }

        uint256 _minCoinAmountOut = _calculateAmountOutMin(address(ellipsisLp), address(collateralToken), lpToBurn_);

        if (ellipsisPoolType == PoolType.PLAIN_2_POOL || ellipsisPoolType == PoolType.PLAIN_3_POOL) {
            return _withdrawFromPlainPool(lpToBurn_, _minCoinAmountOut, coinIdx_);
        }

        if (ellipsisPoolType == PoolType.META_4_POOL) {
            return _withdrawFrom4FactoryMetaPool(lpToBurn_, _minCoinAmountOut, coinIdx_);
        }

        revert("withdraw-from-ellipsis-failed");
    }

    function _withdrawHere(uint256 coinAmountOut_) internal override {
        int128 _i = SafeCast.toInt128(int256(collateralIdx));

        uint256 _lpHere = lpBalanceHere();
        uint256 _totalLp = _lpHere + lpBalanceStaked();
        uint256 _lpToBurn = Math.min((coinAmountOut_ * _totalLp) / _quoteLpToCoin(_totalLp, _i), _totalLp);

        if (_lpToBurn == 0) return;

        if (_lpToBurn > _lpHere) {
            _unstakeLp(_lpToBurn - _lpHere);
        }

        _withdrawFromEllipsis(_lpToBurn, _i);
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    /**
     * @notice Rewards token in gauge can be updated any time. This method refresh list.
     * It is recommended to claimAndSwapRewards before calling this function.
     * @dev LpStaking only distribute EPX rewards other rewards can be distributed using lp
     * contract. It is quite possible to update rewardToken in LP by Ellipsis.
     */
    function setRewardTokens(address[] memory /*rewardTokens_*/) external virtual onlyGovernor {
        // Claim rewards before updating the reward list.
        _claimAndSwapRewards();
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);
    }

    function updateEllipsisSlippage(uint256 newEllipsisSlippage_) external onlyGovernor {
        require(newEllipsisSlippage_ < MAX_BPS, "invalid-slippage-value");
        emit EllipsisSlippageUpdated(ellipsisSlippage, newEllipsisSlippage_);
        ellipsisSlippage = newEllipsisSlippage_;
    }

    function updateMasterOracle(IMasterOracle newMasterOracle_) external onlyGovernor {
        emit MasterOracleUpdated(masterOracle, newMasterOracle_);
        masterOracle = newMasterOracle_;
    }
}
