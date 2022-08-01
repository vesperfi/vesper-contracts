// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Curve3PlainPool.sol";
import "../../../Earn.sol";

//solhint-disable no-empty-blocks
contract EarnCurve3PlainPool is Curve3PlainPool, Earn {
    constructor(
        address pool_,
        address crvPool_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        address dripToken_,
        string memory name_
    ) Curve3PlainPool(pool_, crvPool_, crvSlippage_, masterOracle_, swapper_, collateralIdx_, name_) Earn(dripToken_) {}

    function _approveToken(uint256 _amount) internal virtual override(Strategy, CurvePoolBase) {
        CurvePoolBase._approveToken(_amount);
    }

    function _rebalance()
        internal
        override(Strategy, CurvePoolBase)
        returns (
            uint256 _profit,
            uint256 _loss,
            uint256 _payback
        )
    {
        (_profit, , _payback) = _generateReport();
        _loss = 0;
        _handleProfit(_profit);
        IVesperPool(pool).reportEarning(0, 0, _payback);
        _deposit();
    }
}
