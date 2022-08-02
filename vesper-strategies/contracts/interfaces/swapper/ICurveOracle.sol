// SPDX-License-Identifier: MIT

pragma solidity <=0.8.9;

/**
 * @title Curve Oracle
 * @notice Used to quote LP<->Coin in order to set acceptable amount out (i.e. max slippage)
 */
interface ICurveOracle {
    function quote(
        address tokenIn_,
        address tokenOut_,
        uint256 amountIn_
    ) external view returns (uint256 _amountOut);
}
