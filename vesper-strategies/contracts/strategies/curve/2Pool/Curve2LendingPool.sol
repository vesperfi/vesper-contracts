// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../../../interfaces/curve/IDeposit.sol";
import "./Curve2PlainPool.sol";

// solhint-disable no-empty-blocks

contract Curve2LendingPool is Curve2PlainPool {
    using SafeERC20 for IERC20;

    IDeposit2x internal immutable depositZap;

    constructor(
        address pool_,
        address crvPool_,
        address depositZap_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory _name_
    ) Curve2PlainPool(pool_, crvPool_, crvSlippage_, masterOracle_, swapper_, collateralIdx_, _name_) {
        depositZap = IDeposit2x(depositZap_);
    }

    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        if (address(depositZap) != address(0)) {
            collateralToken.safeApprove(address(depositZap), amount_);
            crvLp.safeApprove(address(depositZap), amount_);
        }
    }

    function _depositToCurve(uint256 coinAmountIn_) internal virtual override {
        if (coinAmountIn_ == 0) {
            return;
        }

        uint256[2] memory _depositAmounts;
        _depositAmounts[collateralIdx] = coinAmountIn_;

        uint256 _lpAmountOutMin = _calculateAmountOutMin(address(collateralToken), address(crvLp), coinAmountIn_);
        if (address(depositZap) != address(0)) {
            depositZap.add_liquidity(_depositAmounts, _lpAmountOutMin);
        } else {
            // Note: Using use_underlying = true to deposit underlying instead of IB token
            IStableSwap2xUnderlying(crvPool).add_liquidity(_depositAmounts, _lpAmountOutMin, true);
        }
    }

    function _withdrawFromCurve(
        uint256 lpAmount_,
        uint256 minAmountOut_,
        int128 i_
    ) internal override {
        if (address(depositZap) != address(0)) {
            depositZap.remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_);
        } else {
            // Note: Using use_underlying = true to deposit underlying instead of IB token
            IStableSwap2xUnderlying(crvPool).remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_, true);
        }
    }

    function _quoteLpToCoin(uint256 amountIn_, int128 toIdx_)
        internal
        view
        virtual
        override
        returns (uint256 amountOut)
    {
        if (amountIn_ == 0) {
            return 0;
        }

        if (address(depositZap) != address(0)) {
            return depositZap.calc_withdraw_one_coin(amountIn_, toIdx_);
        } else {
            return IStableSwap(crvPool).calc_withdraw_one_coin(amountIn_, toIdx_);
        }
    }
}
