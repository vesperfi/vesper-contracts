// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../../curve/4Pool/Curve4PlainOr4MetaPool.sol";
import "../ConvexBase.sol";

/// @title This strategy will deposit collateral token in Curve 4MetaPool and stake lp token to convex.
contract Convex4MetaPool is Curve4PlainOr4MetaPool, ConvexBase {
    using SafeERC20 for IERC20;

    constructor(
        address pool_,
        address crvPool_,
        address masterOracle_,
        address swapper_,
        address crvDeposit_,
        uint256 collateralIdx_,
        uint256 convexPoolId_,
        string memory name_
    )
        Curve4PlainOr4MetaPool(pool_, crvPool_, masterOracle_, swapper_, crvDeposit_, collateralIdx_, name_)
        ConvexBase(convexPoolId_)
    {
        (address _lp, , , , , ) = BOOSTER.poolInfo(convexPoolId_);
        require(_lp == address(crvLp), "incorrect-lp-token");
    }

    function lpBalanceStaked() public view override returns (uint256 total) {
        total = cvxCrvRewards.balanceOf(address(this));
    }

    function _approveToken(uint256 _amount) internal virtual override {
        crvLp.safeApprove(address(BOOSTER), _amount);
        super._approveToken(_amount);
    }

    function _claimRewards() internal override {
        require(cvxCrvRewards.getReward(address(this), true), "reward-claim-failed");
    }

    function _stakeAllLp() internal override {
        uint256 balance = crvLp.balanceOf(address(this));
        if (balance != 0) {
            require(BOOSTER.deposit(convexPoolId, balance, true), "booster-deposit-failed");
        }
    }

    function _unstakeAllLp() internal override {
        cvxCrvRewards.withdrawAllAndUnwrap(isClaimRewards);
    }

    function _unstakeLp(uint256 _amount) internal override {
        if (_amount != 0) {
            require(cvxCrvRewards.withdrawAndUnwrap(_amount, false), "withdraw-and-unwrap-failed");
        }
    }

    /// @dev convex pool can add new rewards. This method refresh list.
    function setRewardTokens(
        address[] memory /*_rewardTokens*/
    ) external override onlyKeeper {
        // Claims all rewards, if any, before updating the reward list
        _claimRewardsAndConvertTo(address(collateralToken));
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);
    }

    function toggleClaimRewards() external onlyGovernor {
        isClaimRewards = !isClaimRewards;
    }
}
