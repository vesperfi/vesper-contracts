// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "../../Strategy.sol";
import "../CurvePoolBase.sol";

/// @title This strategy will deposit collateral token in Curve 3Pool and earn interest.
contract Curve3PlainPool is CurvePoolBase {
    constructor(
        address pool_,
        address crvPool_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    ) CurvePoolBase(pool_, crvPool_, masterOracle_, swapper_, collateralIdx_, name_) {}

    function _depositToCurve(uint256 coinAmountIn_) internal virtual override {
        if (coinAmountIn_ > 0) {
            uint256[3] memory _depositAmounts;
            _depositAmounts[collateralIdx] = coinAmountIn_;

            uint256 _lpOutMin = _calculateAmountOutMin(address(collateralToken), address(crvLp), coinAmountIn_);
            IStableSwap3x(crvPool).add_liquidity(_depositAmounts, _lpOutMin);
        }
    }
}
