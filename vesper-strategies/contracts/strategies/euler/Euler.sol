// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "../Strategy.sol";
import "../../interfaces/euler/IEuler.sol";

/// @title This strategy will deposit collateral token in Euler and earn interest.
contract Euler is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";

    IEToken internal immutable eToken;
    address internal immutable euler;

    uint256 internal constant SUB_ACCOUNT_ID = 0;

    constructor(
        address pool_,
        address swapper_,
        address euler_,
        address eulerMarkets_,
        string memory name_
    ) Strategy(pool_, swapper_, address(0)) {
        require(euler_ != address(0), "euler-protocol-address-is-null");
        require(eulerMarkets_ != address(0), "market-address-is-null");
        receiptToken = _fetchReceiptToken(eulerMarkets_);
        require(receiptToken != address(0), "market-does-not-exist");
        eToken = IEToken(receiptToken);
        euler = euler_;
        NAME = name_;
    }

    function isReservedToken(address token_) public view virtual override returns (bool) {
        return token_ == address(eToken);
    }

    function tvl() external view override returns (uint256) {
        return
            _getUnwrappedAmount(eToken.balanceOfUnderlying(address(this))) + collateralToken.balanceOf(address(this));
    }

    /// @dev Approve all required tokens
    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        collateralToken.safeApprove(euler, amount_);
    }

    //solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address newStrategy_) internal virtual override {}

    function _fetchReceiptToken(address eulerMarkets_) internal view virtual returns (address) {
        return IEulerMarkets(eulerMarkets_).underlyingToEToken(address(collateralToken));
    }

    function _getWrappedAmount(uint256 unwrappedAmount_) internal view virtual returns (uint256) {
        return unwrappedAmount_;
    }

    function _getUnwrappedAmount(uint256 wrappedAmount_) internal view virtual returns (uint256 _unwrapped) {
        return wrappedAmount_;
    }

    /**
     * @dev Generate report for pools accounting and also send profit and any payback to pool.
     */
    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _collateralHere + _getUnwrappedAmount(eToken.balanceOfUnderlying(address(this)));
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
        // After reportEarning strategy may get more collateral from pool. Deposit those in Euler.
        _collateralHere = collateralToken.balanceOf(address(this));

        if (_collateralHere > 0) {
            eToken.deposit(SUB_ACCOUNT_ID, _wrap(_collateralHere));
        }
    }

    function _unwrap(uint256 wrappedAmount_) internal virtual returns (uint256) {
        return wrappedAmount_;
    }

    function _wrap(uint256 unwrappedAmount_) internal virtual returns (uint256) {
        return unwrappedAmount_;
    }

    /// @dev Withdraw collateral here.
    function _withdrawHere(uint256 _amount) internal override {
        // Get minimum of _amount and collateral invested and available liquidity
        uint256 _withdrawAmount = Math.min(
            _getWrappedAmount(_amount),
            Math.min(eToken.balanceOfUnderlying(address(this)), eToken.totalSupplyUnderlying())
        );
        eToken.withdraw(SUB_ACCOUNT_ID, _withdrawAmount);
        // Unwrap wrapped tokens
        _unwrap(_withdrawAmount);
    }
}
