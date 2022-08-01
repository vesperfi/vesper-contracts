// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "../../../interfaces/aave/IAave.sol";
import "../../Strategy.sol";
import "./Curve3LendingPool.sol";

/// @title This strategy will deposit collateral token in Curve Aave 3Pool and earn interest.
// solhint-disable no-empty-blocks
contract Curve3LendingPoolAave is Curve3LendingPool {
    using SafeERC20 for IERC20;
    address private constant CRV_POOL = 0xDeBF20617708857ebe4F679508E7b7863a8A8EeE;
    StakedAave private constant STKAAVE = StakedAave(0x4da27a545c0c5B758a6BA100e3a049001de870f5);
    IERC20 private constant AAVE = IERC20(0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9);

    constructor(
        address pool_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    ) Curve3LendingPool(pool_, CRV_POOL, crvSlippage_, masterOracle_, swapper_, collateralIdx_, name_) {}

    function canStartCooldown() external view returns (bool) {
        (uint256 _cooldownStart, , uint256 _unstakeEnd) = cooldownData();
        return _canStartCooldown(_cooldownStart, _unstakeEnd);
    }

    function canUnstake() external view returns (bool) {
        (, uint256 _cooldownEnd, uint256 _unstakeEnd) = cooldownData();
        return _canUnstake(_cooldownEnd, _unstakeEnd);
    }

    function cooldownData()
        public
        view
        returns (
            uint256 _cooldownStart,
            uint256 _cooldownEnd,
            uint256 _unstakeEnd
        )
    {
        _cooldownStart = STKAAVE.stakersCooldowns(address(this));
        _cooldownEnd = _cooldownStart + STKAAVE.COOLDOWN_SECONDS();
        _unstakeEnd = _cooldownEnd + STKAAVE.UNSTAKE_WINDOW();
    }

    function _canStartCooldown(uint256 cooldownStart_, uint256 unstakeEnd_) internal view returns (bool) {
        return STKAAVE.balanceOf(address(this)) > 0 && (cooldownStart_ == 0 || block.timestamp > unstakeEnd_);
    }

    function _canUnstake(uint256 cooldownEnd_, uint256 unstakeEnd_) internal view returns (bool) {
        return block.timestamp > cooldownEnd_ && block.timestamp <= unstakeEnd_;
    }

    function _claimAave() internal {
        (uint256 _cooldownStart, uint256 _cooldownEnd, uint256 _unstakeEnd) = cooldownData();
        if (_canUnstake(_cooldownEnd, _unstakeEnd)) {
            STKAAVE.redeem(address(this), MAX_UINT_VALUE);
        } else if (_canStartCooldown(_cooldownStart, _unstakeEnd)) {
            STKAAVE.cooldown();
        }
        STKAAVE.claimRewards(address(this), MAX_UINT_VALUE);
    }

    function _claimRewards() internal virtual override {
        CurvePoolBase._claimRewards();
        _claimAave();
    }
}
