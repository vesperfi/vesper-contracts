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

    ILendingPool public immutable lendingPool;

    uint256 public reserveId;
    IStakingRewards public staking;
    address[] public rewardTokens;

    constructor(
        address _pool,
        address _swapper,
        address _lendingPool,
        uint256 _reserveId,
        string memory _name
    ) Strategy(_pool, _swapper, address(0)) {
        lendingPool = ILendingPool(_lendingPool);
        _setReserve(_reserveId);
        NAME = _name;
    }

    function eToken() public view returns (IERC20) {
        return IERC20(receiptToken);
    }

    /// @inheritdoc Strategy
    function isReservedToken(address _token) public view virtual override returns (bool) {
        return _token == receiptToken;
    }

    /// @inheritdoc Strategy
    function tvl() external view override returns (uint256) {
        return collateralToken.balanceOf(address(this)) + _invested();
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        collateralToken.safeApprove(pool, _amount);
        collateralToken.safeApprove(address(lendingPool), _amount);
        eToken().safeApprove(address(staking), _amount);
        eToken().safeApprove(address(lendingPool), _amount);
        uint256 _len = rewardTokens.length;
        for (uint256 i; i < _len; ++i) {
            IERC20(rewardTokens[i]).safeApprove(address(swapper), _amount);
        }
    }

    /// @inheritdoc Strategy
    // solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address) internal virtual override {
        _unstakeAll();
    }

    /// @inheritdoc Strategy
    function _claimAndSwapRewards() internal override {
        // Note: We can only claim all at once
        staking.claim();
        uint256 _len = rewardTokens.length;
        for (uint256 i; i < _len; ++i) {
            address _rewardToken = rewardTokens[i];
            uint256 _rewardsAmount = IERC20(_rewardToken).balanceOf(address(this));
            if (_rewardsAmount > 0 && _rewardToken != address(collateralToken)) {
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
            lendingPool.deposit(reserveId, _amount, address(this), 0);
            uint256 _eTokenBalance = eToken().balanceOf(address(this));
            if (_eTokenBalance > 0) {
                staking.stake(_eTokenBalance, address(this)); // stake all
            }
        }
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
        return _convertToCollateral(eToken().balanceOf(address(this)) + staking.balanceOf(address(this)));
    }

    /// @dev Generate report for pools accounting and also send profit and any payback to pool.
    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
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

        IVesperPool(pool).reportEarning(_profit, _loss, _payback);

        // After reportEarning strategy may get more collateral from pool. Deposit those in ExtraFinance.
        _deposit(collateralToken.balanceOf(address(this)));
    }

    /// @dev Assign reserve's params
    function _setReserve(uint256 _reserveId) private {
        require(lendingPool.getUnderlyingTokenAddress(_reserveId) == address(collateralToken), "invalid-reserve");
        address _receiptToken = lendingPool.getETokenAddress(_reserveId);
        require(_receiptToken != address(0), "eToken-address-is-zero");
        require(IEToken(_receiptToken).lendingPool() == address(lendingPool), "invalid-lending-pool");
        receiptToken = _receiptToken;
        staking = IStakingRewards(lendingPool.getStakingAddress(_reserveId));
        require(address(staking) != address(0), "staking-address-is-zero");
        reserveId = _reserveId;
        rewardTokens = _getRewardTokens();
    }

    function _unstakeAll() private {
        uint256 _staked = staking.balanceOf(address(this));
        if (_staked > 0) {
            staking.withdraw(_staked, address(this));
        }
    }

    /// @dev Withdraw collateral here. Do not transfer to pool
    function _withdrawHere(uint256 _collateralAmount) internal override {
        // Get minimum of requested amount and available collateral
        _collateralAmount = Math.min(
            _collateralAmount,
            Math.min(_invested(), collateralToken.balanceOf(address(eToken())))
        );

        uint256 _eTokenAmount = _convertToReceiptToken(_collateralAmount);
        uint256 _eTokenBalance = eToken().balanceOf(address(this));

        if (_eTokenAmount > _eTokenBalance) {
            uint256 _unstakeAmount = _eTokenAmount - _eTokenBalance;
            staking.withdraw(_unstakeAmount, address(this));
            _eTokenBalance = eToken().balanceOf(address(this));
        }

        if (_eTokenAmount > 0) {
            lendingPool.redeem(reserveId, Math.min(_eTokenAmount, _eTokenBalance), address(this), false);
        }
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    /// @notice Rewards token can be updated any time. This method refresh list
    function refetchRewardTokens(uint256 _claimAmountOutMin) external virtual onlyGovernor {
        // Claim rewards before updating the reward list.
        uint256 _before = collateralToken.balanceOf(address(this));
        _claimAndSwapRewards();
        require(collateralToken.balanceOf(address(this)) - _before >= _claimAmountOutMin, "slippage-too-high");
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);
    }

    /// @notice Migrate funds to another reserve that supports' the same collateral
    function migrateReserve(uint256 _newReserveId, uint256 _claimAmountOutMin) external onlyGovernor {
        // 1. Claim rewards from current staking contract
        uint256 _before = collateralToken.balanceOf(address(this));
        _claimAndSwapRewards();
        require(collateralToken.balanceOf(address(this)) - _before >= _claimAmountOutMin, "slippage-too-high");

        // 2. Withdraw all collateral
        // Note: Do not use `_withdrawHere` in order to make it reverts if available liquidity isn't enough
        _unstakeAll();
        lendingPool.redeem(reserveId, eToken().balanceOf(address(this)), address(this), false);

        // 3. Setup the new reserve
        _setReserve(_newReserveId);

        // 4. Fetch reward tokens from the new staking contract
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);

        // 5. Deposit all collateral to the new reserve
        _deposit(collateralToken.balanceOf(address(this)));
    }
}
