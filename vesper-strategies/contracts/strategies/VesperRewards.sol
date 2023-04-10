// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-commons/contracts/interfaces/vesper/IStrategy.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "vesper-pools/contracts/interfaces/vesper/IPoolRewards.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/swapper/IRoutedSwapper.sol";

library VesperRewards {
    using SafeERC20 for IERC20;

    function _approveToken(IVesperPool vPool_, IRoutedSwapper swapper_, uint256 amount_) internal {
        address _poolRewards = vPool_.poolRewards();
        if (_poolRewards != address(0)) {
            address[] memory _rewardTokens = IPoolRewards(_poolRewards).getRewardTokens();
            uint256 _length = _rewardTokens.length;
            for (uint256 i; i < _length; ++i) {
                if (!IStrategy(address(this)).isReservedToken(_rewardTokens[i])) {
                    IERC20(_rewardTokens[i]).safeApprove(address(swapper_), amount_);
                }
            }
        }
    }

    function _claimAndSwapRewards(IVesperPool vPool_, IRoutedSwapper swapper_, address collateralToken_) internal {
        address _poolRewards = vPool_.poolRewards();
        if (_poolRewards != address(0)) {
            IPoolRewards(_poolRewards).claimReward(address(this));
            address[] memory _rewardTokens = IPoolRewards(_poolRewards).getRewardTokens();
            uint256 _length = _rewardTokens.length;
            for (uint256 i; i < _length; ++i) {
                uint256 _rewardAmount = IERC20(_rewardTokens[i]).balanceOf(address(this));
                if (_rewardAmount > 0 && _rewardTokens[i] != collateralToken_) {
                    try
                        swapper_.swapExactInput(_rewardTokens[i], collateralToken_, _rewardAmount, 1, address(this))
                    {} catch {} //solhint-disable no-empty-blocks
                }
            }
        }
    }
}
