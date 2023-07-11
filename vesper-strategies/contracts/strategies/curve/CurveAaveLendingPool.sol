// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "../../interfaces/aave/IAave.sol";
import "../Strategy.sol";
import "./Curve.sol";

/// @title This strategy will deposit collateral token in Curve Aave 3Pool and earn interest.
// solhint-disable no-empty-blocks
contract CurveAaveLendingPool is Curve {
    using SafeERC20 for IERC20;
    address private constant CRV_POOL = 0xDeBF20617708857ebe4F679508E7b7863a8A8EeE;
    StakedAave private constant STKAAVE = StakedAave(0x4da27a545c0c5B758a6BA100e3a049001de870f5);
    IERC20 private constant AAVE = IERC20(0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9);

    constructor(
        address pool_,
        PoolType curvePoolType_,
        address depositZap_,
        address crvToken_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    )
        Curve(
            pool_,
            CRV_POOL,
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

    function canStartCooldown() external view returns (bool) {
        (uint256 _cooldownStart, , uint256 _unstakeEnd) = cooldownData();
        return _canStartCooldown(_cooldownStart, _unstakeEnd);
    }

    function canUnstake() external view returns (bool) {
        (, uint256 _cooldownEnd, uint256 _unstakeEnd) = cooldownData();
        return _canUnstake(_cooldownEnd, _unstakeEnd);
    }

    function cooldownData() public view returns (uint256 _cooldownStart, uint256 _cooldownEnd, uint256 _unstakeEnd) {
        _cooldownStart = STKAAVE.stakersCooldowns(address(this));
        _cooldownEnd = _cooldownStart + STKAAVE.COOLDOWN_SECONDS();
        _unstakeEnd = _cooldownEnd + STKAAVE.UNSTAKE_WINDOW();
    }

    function _canStartCooldown(uint256 cooldownStart_, uint256 unstakeEnd_) private view returns (bool) {
        return STKAAVE.balanceOf(address(this)) > 0 && (cooldownStart_ == 0 || block.timestamp > unstakeEnd_);
    }

    function _canUnstake(uint256 cooldownEnd_, uint256 unstakeEnd_) private view returns (bool) {
        return block.timestamp > cooldownEnd_ && block.timestamp <= unstakeEnd_;
    }

    function _claimAave() private {
        (uint256 _cooldownStart, uint256 _cooldownEnd, uint256 _unstakeEnd) = cooldownData();
        if (STKAAVE.balanceOf(address(this)) > 0) {
            if (_canUnstake(_cooldownEnd, _unstakeEnd)) {
                STKAAVE.redeem(address(this), MAX_UINT_VALUE);
            } else if (_canStartCooldown(_cooldownStart, _unstakeEnd)) {
                STKAAVE.cooldown();
            }
            STKAAVE.claimRewards(address(this), MAX_UINT_VALUE);
        }
    }

    /// @dev Return values are not being used hence returning 0
    function _claimRewards() internal override returns (address _rewardToken, uint256 _rewardAmount) {
        // Claim rewards. It may include stkAave as rewards.
        (_rewardToken, _rewardAmount) = CurveBase._claimRewards();
        // Claim AAVE from stkAAVE or start cooldown for claim.
        _claimAave();
    }

    /**
     * @dev Prepare rewardToken array
     */
    function _getRewardTokens() internal view override returns (address[] memory _rewardTokens) {
        // Actual reward from Curve is stkAAVE but we will be claiming AAVE from
        // stkAAVE and then we will convert AAVE into Collateral, so internally
        // reward token is AAVE
        _rewardTokens = new address[](2);
        _rewardTokens[0] = CRV;
        _rewardTokens[1] = address(AAVE);
    }
}
