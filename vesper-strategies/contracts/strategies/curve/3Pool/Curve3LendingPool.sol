// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "../../Strategy.sol";
import "./Curve3PlainPool.sol";

/// @title This strategy will deposit collateral token in Curve Lending 3Pool and earn interest.
// solhint-disable no-empty-blocks
contract Curve3LendingPool is Curve3PlainPool {
    using SafeERC20 for IERC20;

    constructor(
        address pool_,
        address crvPool_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    ) Curve3PlainPool(pool_, crvPool_, crvSlippage_, masterOracle_, swapper_, collateralIdx_, name_) {}

    function _depositToCurve(uint256 coinAmountIn_) internal override {
        if (coinAmountIn_ > 0) {
            uint256[3] memory _depositAmounts;
            _depositAmounts[collateralIdx] = coinAmountIn_;

            uint256 _lpAmountOutMin = _calculateAmountOutMin(address(collateralToken), address(crvLp), coinAmountIn_);
            // Note: Using use_underlying = true to deposit underlying instead of IB token
            IStableSwap3xUnderlying(crvPool).add_liquidity(_depositAmounts, _lpAmountOutMin, true);
        }
    }

    function _withdrawFromCurve(
        uint256 lpAmount_,
        uint256 minAmountOut_,
        int128 i_
    ) internal override {
        // Note: Using use_underlying = true to withdraw underlying instead of IB token
        IStableSwap3xUnderlying(crvPool).remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_, true);
    }
}
