// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "../../../interfaces/curve/IDeposit.sol";
import "../../Strategy.sol";
import "../CurvePoolBase.sol";

/// @title This strategy will deposit collateral token in Curve Lending 4Pool and earn interest.
// solhint-disable no-empty-blocks
contract Curve4LendingPool is CurvePoolBase {
    using SafeERC20 for IERC20;

    IDeposit4x public immutable crvDeposit;

    constructor(
        address pool_,
        address crvPool_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        address crvDeposit_,
        uint256 collateralIdx_,
        string memory name_
    ) CurvePoolBase(pool_, crvPool_, crvSlippage_, masterOracle_, swapper_, collateralIdx_, name_) {
        crvDeposit = IDeposit4x(crvDeposit_);
    }

    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        if (address(crvDeposit) != address(0)) {
            collateralToken.safeApprove(address(crvDeposit), amount_);
            crvLp.safeApprove(address(crvDeposit), amount_);
        }
    }

    function _depositToCurve(uint256 coinAmountIn_) internal override {
        if (coinAmountIn_ > 0) {
            uint256[4] memory _depositAmounts;
            _depositAmounts[collateralIdx] = coinAmountIn_;

            uint256 _lpAmountOutMin = _calculateAmountOutMin(address(collateralToken), address(crvLp), coinAmountIn_);

            if (address(crvPool) != address(0)) {
                crvDeposit.add_liquidity(_depositAmounts, _lpAmountOutMin);
            } else {
                // Note: Using use_underlying = true to deposit underlying instead of IB token
                IStableSwap4xUnderlying(crvPool).add_liquidity(_depositAmounts, _lpAmountOutMin, true);
            }
        }
    }

    function _withdrawFromCurve(
        uint256 lpAmount_,
        uint256 minAmountOut_,
        int128 i_
    ) internal override {
        if (address(crvDeposit) != address(0)) {
            crvDeposit.remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_);
        } else {
            // Note: Using use_underlying = true to deposit underlying instead of IB token
            IStableSwap4xUnderlying(crvPool).remove_liquidity_one_coin(lpAmount_, i_, minAmountOut_, true);
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

        if (address(crvDeposit) != address(0)) {
            return crvDeposit.calc_withdraw_one_coin(amountIn_, toIdx_);
        } else {
            return IStableSwap(crvPool).calc_withdraw_one_coin(amountIn_, toIdx_);
        }
    }
}
