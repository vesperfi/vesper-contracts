// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Strategy.sol";
import "../../interfaces/sommelier/ISommelier.sol";

/// @dev This strategy will deposit collateral token in Sommelier and earn yield.
contract Sommelier is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";
    // Same as receiptToken but it's immutable and saves gas
    ICellar public immutable cellar;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        string memory name_
    ) Strategy(pool_, swapper_, receiptToken_) {
        require(ICellar(receiptToken_).asset() == address(IVesperPool(pool_).token()), "invalid-receipt-token");
        cellar = ICellar(receiptToken_);
        NAME = name_;
    }

    function isReservedToken(address token_) public view override returns (bool) {
        return receiptToken == token_ || address(collateralToken) == token_;
    }

    function tvl() public view virtual override returns (uint256) {
        return _getCollateralInCellar() + collateralToken.balanceOf(address(this));
    }

    /**
     * @notice Time when withdraw and transfer will be unlocked.
     */
    function unlockTime() public view returns (uint256) {
        return cellar.userShareLockStartTime(address(this)) + cellar.shareLockPeriod();
    }

    /// @notice Large approval of token
    function _approveToken(uint256 amount_) internal override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(cellar), amount_);
    }

    //solhint-disable no-empty-blocks
    function _beforeMigration(address _newStrategy) internal override {}

    function _getCollateralInCellar() internal view returns (uint256) {
        return cellar.convertToAssets(cellar.balanceOf(address(this)));
    }

    function _rebalance() internal override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));

        uint256 _totalCollateral = _getCollateralInCellar() + _collateralHere;

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
        if (_collateralHere > 0) {
            cellar.deposit(_collateralHere, address(this));
        }
    }

    /// @dev Withdraw collateral here
    function _withdrawHere(uint256 requireAmount_) internal override {
        if (block.timestamp >= unlockTime()) {
            // withdraw asking more than available liquidity will fail. To do safe withdraw, check
            // requireAmount_ against available liquidity.
            uint256 _withdrawable = Math.min(
                requireAmount_,
                Math.min(_getCollateralInCellar(), cellar.totalAssetsWithdrawable())
            );
            if (_withdrawable > 0) {
                cellar.withdraw(_withdrawable, address(this), address(this));
            }
        }
    }
}
