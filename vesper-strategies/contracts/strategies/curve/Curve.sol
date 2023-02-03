// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./CurveBase.sol";

/// @title This strategy will deposit collateral token in a Curve Pool and earn interest.
// solhint-disable no-empty-blocks
contract Curve is CurveBase {
    using SafeERC20 for IERC20;

    constructor(
        address pool_,
        address crvPool_,
        CurveBase.PoolType curvePoolType_,
        address depositZap_,
        address crvToken_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    )
        CurveBase(
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
    {
        rewardTokens = _getRewardTokens();
    }

    /**
     * @dev Prepare rewardToken array
     * @return _rewardTokens The array of reward tokens (both base and extra rewards)
     */
    function _getRewardTokens() internal view virtual override returns (address[] memory _rewardTokens) {
        _rewardTokens = new address[](1);
        _rewardTokens[0] = CRV;

        // If there is no gauge, CRV only
        if (address(crvGauge) == address(0)) {
            return _rewardTokens;
        }

        // If LiquidityGaugeReward, `rewarded_token` only
        try ILiquidityGaugeReward(address(crvGauge)).rewarded_token() returns (address _rewardToken) {
            _rewardTokens = new address[](2);
            _rewardTokens[0] = CRV;
            _rewardTokens[1] = _rewardToken;
            return _rewardTokens;
        } catch {}

        // If LiquidityGaugeV2 or LiquidityGaugeV3, CRV + extra reward tokens
        try ILiquidityGaugeV2(address(crvGauge)).reward_tokens(0) returns (address _rewardToken) {
            // If no extra reward token, CRV only
            if (_rewardToken == address(0)) {
                return _rewardTokens;
            }

            try ILiquidityGaugeV2(address(crvGauge)).reward_count() returns (uint256 _len) {
                _rewardTokens = new address[](1 + _len);
                _rewardTokens[0] = CRV;
                _rewardTokens[1] = _rewardToken;
                for (uint256 i = 1; i < _len; ++i) {
                    _rewardTokens[i + 1] = ILiquidityGaugeV2(address(crvGauge)).reward_tokens(i);
                }
                return _rewardTokens;
            } catch {
                // If doesn't implement `reward_count` assuming only one extra reward token
                // E.g. stETH pool
                _rewardTokens = new address[](2);
                _rewardTokens[0] = CRV;
                _rewardTokens[1] = _rewardToken;
                return _rewardTokens;
            }
        } catch {}

        // If LiquidityGauge, CRV only
        return _rewardTokens;
    }
}
