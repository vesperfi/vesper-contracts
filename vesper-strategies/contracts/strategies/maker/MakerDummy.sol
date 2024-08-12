// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Strategy.sol";

/// @title This strategy will report loss to the pool.
contract MakerDummy is Strategy {
    using SafeERC20 for IERC20;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.1.0";
    bytes32 public immutable collateralType;

    constructor(
        address pool_,
        address swapper_,
        address receiptToken_,
        bytes32 collateralType_,
        string memory name_
    ) Strategy(pool_, swapper_, receiptToken_) {
        collateralType = collateralType_;
        NAME = name_;
    }

    function tvl() public view virtual override returns (uint256) {
        return collateralToken.balanceOf(address(this));
    }

    // Allow any token to be withdrawn
    function isReservedToken(address /*_token*/) public pure override returns (bool) {
        return false;
    }

    function rebalanceToReportLoss(
        uint256 lossInCollateral_
    ) external onlyKeeper returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        // Safe to assume that strategy debtRatio will be set to 0.
        _loss = Math.min(lossInCollateral_, IVesperPool(pool).excessDebt(address(this)));
        IVesperPool(pool).reportEarning(0, _loss, 0);
        return (0, _loss, 0);
    }

    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
    }

    function _beforeMigration(address _newStrategy) internal override {}

    function _rebalance() internal virtual override returns (uint256 _profit, uint256 _loss, uint256 _payback) {}

    // This strategy will not withdraw collateral when pool.withdraw() is called.
    function _withdrawHere(uint256 _amount) internal override {}
}
