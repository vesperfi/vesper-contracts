// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./EllipsisBase.sol";

/// @title This strategy will deposit collateral token in a Ellipsis Pool and earn interest.
contract Ellipsis is EllipsisBase {
    using SafeERC20 for IERC20;
    using SafeERC20 for IEllipsisLp;

    constructor(
        address pool_,
        address ellipsisPool_,
        PoolType ellipsisPoolType_,
        address depositZap_,
        uint256 ellipsisSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    )
        EllipsisBase(
            pool_,
            ellipsisPool_,
            ellipsisPoolType_,
            depositZap_,
            ellipsisSlippage_,
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
        try ellipsisLp.rewardCount() returns (uint256 _len) {
            // Meta and Factory pools
            _rewardTokens = new address[](1 + _len);
            for (uint256 i; i < _len; ++i) {
                _rewardTokens[i] = ellipsisLp.rewardTokens(i);
            }
            _rewardTokens[_len] = EPX;
            return _rewardTokens;
        } catch {
            // Base pools
            _rewardTokens = new address[](1);
            _rewardTokens[0] = EPX;
            return _rewardTokens;
        }
    }
}
