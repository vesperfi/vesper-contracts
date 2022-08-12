// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./Curve2PlainPool.sol";

// solhint-disable no-empty-blocks

contract Curve2LendingPool is Curve2PlainPool {
    constructor(
        address pool_,
        address crvPool_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory _name_
    ) Curve2PlainPool(pool_, crvPool_, crvSlippage_, masterOracle_, swapper_, collateralIdx_, _name_) {}

    function _depositToCurve(uint256 coinAmountIn_) internal virtual override {
        if (coinAmountIn_ > 0) {
            uint256[2] memory _depositAmounts;
            _depositAmounts[collateralIdx] = coinAmountIn_;

            uint256 _lpAmountOutMin = _calculateAmountOutMin(address(collateralToken), address(crvLp), coinAmountIn_);
            // Note: Using use_underlying = true to deposit underlying instead of IB token
            IStableSwap2xUnderlying(crvPool).add_liquidity(_depositAmounts, _lpAmountOutMin, true);
        }
    }

    function _withdrawFromCurve(
        uint256 lpAmount_,
        uint256 minAmountOut_,
        int128 i_
    ) internal override {
        // Note: Using use_underlying = true to withdraw underlying instead of IB token
        IStableSwap2xUnderlying(crvPool).remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_, true);
    }
}
