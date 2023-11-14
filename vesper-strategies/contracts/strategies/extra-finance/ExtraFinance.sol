// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Strategy.sol";
import "../../interfaces/extra-finance/ILendingPool.sol";
import "../../interfaces/extra-finance/IEToken.sol";
import "../../interfaces/extra-finance/IStakingRewards.sol";

/// @title This strategy will deposit collateral token in Extra Finance and earn interest.
contract ExtraFinance is Strategy {
    using SafeERC20 for IERC20;
    using SafeERC20 for IEToken;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";

    IEToken internal immutable eToken;
    uint256 public immutable reserveId;
    ILendingPool public immutable lendingPool;
    address[] public rewardTokens;
    IStakingRewards public immutable staking;

    constructor(
        address _pool,
        address _swapper,
        address _receiptToken,
        uint256 _reserveId,
        string memory _name
    ) Strategy(_pool, _swapper, _receiptToken) {
        require(_receiptToken != address(0), "eToken-address-is-zero");
        eToken = IEToken(_receiptToken);
        lendingPool = ILendingPool(eToken.lendingPool());
        require(address(eToken) == lendingPool.reserves(_reserveId).eTokenAddress, "invalid-receipt-token");
        staking = IStakingRewards(lendingPool.getStakingAddress(_reserveId));
        require(address(staking) != address(0), "staking-address-is-zero");
        reserveId = _reserveId;
        NAME = _name;
        rewardTokens = _getRewardTokens();
    }

    /// @inheritdoc Strategy
    function isReservedToken(address _token) public view virtual override returns (bool) {
        return _token == address(eToken);
    }

    /// @inheritdoc Strategy
    function tvl() external view override returns (uint256) {
        return collateralToken.balanceOf(address(this)) + _invested();
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        collateralToken.safeApprove(pool, _amount);
        collateralToken.safeApprove(address(lendingPool), _amount);
        uint256 _len = rewardTokens.length;
        for (uint256 i; i < _len; ++i) {
            IERC20(rewardTokens[i]).safeApprove(address(swapper), _amount);
        }
    }

    /// @inheritdoc Strategy
    // solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address) internal virtual override {
        _withdrawHere(_invested());
    }

    function _claimAndSwapRewards() internal override {
        // Note: We can only claim all at once
        staking.claim();
        uint256 _len = rewardTokens.length;
        for (uint256 i; i < _len; ++i) {
            address _rewardToken = rewardTokens[i];
            uint256 _rewardsAmount = IERC20(_rewardToken).balanceOf(address(this));
            if (_rewardsAmount > 0) {
                _safeSwapExactInput(_rewardToken, address(collateralToken), _rewardsAmount);
            }
        }
    }

    /// @dev Convert eToken amount to collateral amount
    function _convertToCollateral(uint256 _eTokenAmount) private view returns (uint256 _collateralAmount) {
        return (_eTokenAmount * lendingPool.exchangeRateOfReserve(reserveId)) / 1e18;
    }

    /// @dev Convert collateral amount to eToken amount
    function _convertToReceiptToken(uint256 _collateralAmount) private view returns (uint256 _eTokenAmount) {
        return (_collateralAmount * 1e18) / lendingPool.exchangeRateOfReserve(reserveId);
    }

    /// @dev Deposit collateral and stake the received eTokens
    function _deposit(uint256 _amount) internal virtual {
        if (_amount > 0) {
            lendingPool.depositAndStake(reserveId, _amount, address(this), 0);
        }
    }

    ///  @dev Generate profit, loss and payback statement. Also claim rewards.
    function _generateReport() internal virtual returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _collateralHere + _invested();
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
    }

    /// @dev Fetch reward tokens from the stake contract
    function _getRewardTokens() internal view virtual returns (address[] memory _rewardTokens) {
        IStakingRewards _staking = staking;
        uint256 _len = _staking.rewardsTokenListLength();
        _rewardTokens = new address[](_len);
        for (uint256 i; i < _len; ++i) {
            _rewardTokens[i] = _staking.rewardTokens(i);
        }
    }

    /// @dev Total collateral amount allocated
    function _invested() private view returns (uint256) {
        // Note: This receipt tokens are automatically staked when depositing
        return _convertToCollateral(staking.balanceOf(address(this)));
    }

    /// @dev Generate report for pools accounting and also send profit and any payback to pool.
    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        (_profit, _loss, _payback) = _generateReport();
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        // After reportEarning strategy may get more collateral from pool. Deposit those in Compound.
        _deposit(collateralToken.balanceOf(address(this)));
    }

    /// @dev Withdraw collateral here. Do not transfer to pool
    function _withdrawHere(uint256 _collateralAmount) internal override {
        // Get minimum of requested amount and available collateral
        _collateralAmount = Math.min(
            _collateralAmount,
            Math.min(_invested(), collateralToken.balanceOf(address(eToken)))
        );

        uint256 _eTokenAmount = _convertToReceiptToken(_collateralAmount);

        if (_eTokenAmount > 0) {
            lendingPool.unStakeAndWithdraw(reserveId, _eTokenAmount, address(this), false);
        }
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    /// @notice Rewards token can be updated any time. This method refresh list.
    function refetchRewardTokens(uint256 _amountOutMin) external virtual onlyGovernor {
        // Claim rewards before updating the reward list.
        uint256 _before = collateralToken.balanceOf(address(this));
        _claimAndSwapRewards();
        require(collateralToken.balanceOf(address(this)) - _before >= _amountOutMin, "slippage-too-high");
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);
    }
}
