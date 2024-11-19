// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Strategy.sol";
import {IFraxlendPairV3 as IFraxlendPair} from "../../interfaces/frax-lend/IFraxlendPairV3.sol";

/// @title This strategy will deposit FRAX as collateral token in Fraxlend and earn interest.
contract FraxLendV3 is Strategy {
    using SafeERC20 for IERC20;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";

    IFraxlendPair internal immutable fraxlendPair;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        string memory name_
    ) Strategy(pool_, swapper_, receiptToken_) {
        require(receiptToken_ != address(0), "frax-lend-address-is-null");
        require(IFraxlendPair(receiptToken_).asset() == address(collateralToken), "collateral-mismatch");
        fraxlendPair = IFraxlendPair(receiptToken_);
        NAME = name_;
    }

    function isReservedToken(address token_) public view virtual override returns (bool) {
        return token_ == address(fraxlendPair);
    }

    function tvl() external view override returns (uint256) {
        return _balanceOfUnderlying() + collateralToken.balanceOf(address(this));
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 amount_) internal virtual override {
        collateralToken.safeApprove(pool, amount_);
        collateralToken.safeApprove(address(fraxlendPair), amount_);
    }

    function _balanceOfUnderlying() internal view returns (uint256) {
        return fraxlendPair.convertToAssets(fraxlendPair.balanceOf(address(this)));
    }

    //solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address newStrategy_) internal virtual override {}

    /**
     * @notice Deposit collateral in Fraxlend.
     */
    function _deposit(uint256 amount_) internal virtual {
        if (amount_ > 0) {
            fraxlendPair.deposit(amount_, address(this));
        }
    }

    /**
     * @dev Generate profit, loss and payback statement. Also claim rewards.
     */
    function _generateReport() internal virtual returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _collateralHere + _balanceOfUnderlying();
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

    /**
     * @dev Generate report for pools accounting and also send profit and any payback to pool.
     */
    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        (_profit, _loss, _payback) = _generateReport();
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        // After reportEarning strategy may get more collateral from pool. Deposit those in protocol.
        _deposit(collateralToken.balanceOf(address(this)));
    }

    function _withdrawHere(uint256 amount_) internal override {
        // Check protocol has enough assets to entertain this withdraw amount_
        uint256 _withdrawAmount = Math.min(amount_, fraxlendPair.maxWithdraw(address(this)));
        fraxlendPair.withdraw(_withdrawAmount, address(this), address(this));
    }
}
