// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "../Strategy.sol";
import "../../interfaces/yearn/IYToken.sol";

/// @title This strategy will deposit collateral token in a Yearn vault and earn interest.
contract Yearn is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";
    IYToken internal immutable yToken;
    uint256 internal immutable yTokenDecimals;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        string memory name_
    ) Strategy(pool_, swapper_, receiptToken_) {
        require(receiptToken_ != address(0), "yToken-address-is-zero");
        yToken = IYToken(receiptToken_);
        yTokenDecimals = 10 ** yToken.decimals();
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
    }

    //solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address _newStrategy) internal override {}

    function _convertToShares(uint256 collateralAmount_) internal view returns (uint256) {
        return (collateralAmount_ * yTokenDecimals) / yToken.pricePerShare();
    }

    function _getCollateralFromYearn() internal view returns (uint256) {
        return (yToken.balanceOf(address(this)) * yToken.pricePerShare()) / yTokenDecimals;
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
        if (_collateralHere > 0) {
            yToken.deposit(_collateralHere);
        }
    }

    function _withdrawHere(uint256 amount_) internal override {
        uint256 _toWithdraw = Math.min(yToken.balanceOf(address(this)), _convertToShares(amount_));
        if (_toWithdraw > 0) {
            yToken.withdraw(_toWithdraw);
        }
    }
}
