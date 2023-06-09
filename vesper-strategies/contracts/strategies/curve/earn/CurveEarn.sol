// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../Curve.sol";
import "../../Earn.sol";

//solhint-disable no-empty-blocks
contract CurveEarn is Curve, Earn {
    constructor(
        address pool_,
        address crvPool_,
        PoolType curvePoolType_,
        address depositZap_,
        address crvToken_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        address dripToken_,
        string memory name_
    )
        Curve(
            pool_,
            crvPool_,
            curvePoolType_,
            depositZap_,
            crvToken_,
            crvSlippage_,
            masterOracle_,
            swapper_,
            collateralIdx_,
            name_
        )
        Earn(dripToken_)
    {}

    function _approveToken(uint256 _amount) internal virtual override(Strategy, CurveBase) {
        CurveBase._approveToken(_amount);
    }

    function _claimAndSwapRewards() internal override(CurveBase, Strategy) {
        return CurveBase._claimAndSwapRewards();
    }

    function _claimRewards() internal override(CurveBase, Strategy) returns (address, uint256) {
        return CurveBase._claimRewards();
    }

    function _rebalance()
        internal
        override(Strategy, CurveBase)
        returns (uint256 _profit, uint256 _loss, uint256 _payback)
    {
        (_profit, , _payback) = _generateReport();
        _handleProfit(_profit);
        _profit = 0;
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        _deposit();
    }
}
