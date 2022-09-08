// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "../Strategy.sol";
import "../../interfaces/euler/IEuler.sol";

/// @title This strategy will deposit collateral token in Euler and earn interest.
contract Euler is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.0.0";

    IEToken internal immutable eToken;

    address internal immutable protocol;

    uint256 internal constant SUB_ACCOUNT_ID = 0;

    constructor(
        address pool_,
        address swapper_,
        address markets_,
        address protocol_,
        string memory name_
    ) Strategy(pool_, swapper_, address(0)) {
        require(markets_ != address(0), "market-address-is-null");
        require(protocol_ != address(0), "euler-protocol-address-is-null");
        receiptToken = IEulerMarkers(markets_).underlyingToEToken(address(collateralToken));
        eToken = IEToken(receiptToken);
        protocol = protocol_;
        NAME = name_;
    }

    function isReservedToken(address _token) public view virtual override returns (bool) {
        return _token == address(eToken);
    }

    function tvl() external view override returns (uint256) {
        return eToken.balanceOfUnderlying(address(this)) + collateralToken.balanceOf(address(this));
    }

    /// @dev Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        collateralToken.safeApprove(protocol, _amount);
    }

    //solhint-disable-next-line no-empty-blocks
    function _beforeMigration(address _newStrategy) internal virtual override {}

    //solhint-disable-next-line no-empty-blocks
    function _claimRewardsAndConvertTo(address _toToken) internal virtual {}

    /**
     * @dev Generate report for pools accounting and also send profit and any payback to pool.
     */
    function _rebalance()
        internal
        virtual
        override
        returns (
            uint256 _profit,
            uint256 _loss,
            uint256 _payback
        )
    {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        _claimRewardsAndConvertTo(address(collateralToken));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _collateralHere + eToken.balanceOfUnderlying(address(this));
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
            // The "0" argument refers to the sub-account you are depositing to.
            eToken.deposit(SUB_ACCOUNT_ID, _collateralHere);
        }
    }

    /// @dev Withdraw collateral here. Do not transfer to pool
    function _withdrawHere(uint256 _amount) internal override {
        // Get minimum of _amount and collateral invested and available liquidity
        uint256 _withdrawAmount = Math.min(
            _amount,
            Math.min(eToken.balanceOfUnderlying(address(this)), eToken.totalSupplyUnderlying())
        );
        eToken.withdraw(SUB_ACCOUNT_ID, _withdrawAmount);
    }
}
