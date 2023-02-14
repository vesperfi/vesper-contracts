// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "../PoolRewards.sol";
import "../../interfaces/vesper/IVesperPool.sol";
import "../../interfaces/token/IToken.sol";

interface IVesperPoolV2 {
    function getPricePerShare() external view returns (uint256);
}

contract VesperEarnDrip is PoolRewards {
    TokenLike internal constant WETH = TokenLike(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    using SafeERC20 for IERC20;

    event DripRewardPaid(address indexed user, address indexed rewardToken, uint256 reward);
    event GrowTokenUpdated(address indexed oldGrowToken, address indexed newGrowToken);

    address public growToken;

    receive() external payable {
        require(msg.sender == address(WETH), "deposits-not-allowed");
    }

    /**
     * @notice Returns claimable reward amount.
     * @dev In case of growToken it will return the actual underlying value
     * @return _rewardTokens Array of tokens being rewarded
     * @return _claimableAmounts Array of claimable for token on same index in rewardTokens
     */
    function claimable(
        address account_
    ) external view override returns (address[] memory _rewardTokens, uint256[] memory _claimableAmounts) {
        uint256 _totalSupply = IERC20(pool).totalSupply();
        uint256 _balance = IERC20(pool).balanceOf(account_);
        _rewardTokens = rewardTokens;
        uint256 _len = _rewardTokens.length;
        _claimableAmounts = new uint256[](_len);
        for (uint256 i; i < _len; i++) {
            uint256 _claimableAmount = _claimable(_rewardTokens[i], account_, _totalSupply, _balance);
            if (_rewardTokens[i] == growToken) {
                _claimableAmount = _calculateRewardInDripToken(growToken, _claimableAmount);
            }
            _claimableAmounts[i] = _claimableAmount;
        }
    }

    /// @dev Here _rewardToken AKA growToken is Vesper Grow Pool which can be V2 or V3 pool.
    /// V2 and V3 pool has different signature to read price per share
    function _calculateRewardInDripToken(address rewardToken_, uint256 reward_) private view returns (uint256) {
        uint256 _pricePerShare;
        // Try reading price per share using V3 pool signature, if this fails catch block will execute
        try IVesperPool(rewardToken_).pricePerShare() returns (uint256 _pricePerShareV3) {
            _pricePerShare = _pricePerShareV3;
        } catch {
            // If try fails, read price per share using V2 pool signature
            _pricePerShare = IVesperPoolV2(rewardToken_).getPricePerShare();
        }
        // Calculate reward in dripToken, as _reward is share of Grow Pool AKA growToken AKA _rewardToken
        return (_pricePerShare * reward_) / 1e18;
    }

    /**
     * @notice Claim earned rewards in dripToken.
     * @dev Withdraws from the Grow Pool and transfers the amount to _account
     * @dev Claim rewards only if reward in dripToken is non zero
     */
    function _claimReward(address rewardToken_, address account_, uint256 reward_) internal override {
        if (rewardToken_ == growToken) {
            // Calculate reward in drip token
            uint256 _rewardInDripToken = _calculateRewardInDripToken(rewardToken_, reward_);
            // If reward in drip token is non zero
            if (_rewardInDripToken > 0) {
                // Mark reward as claimed
                rewards[rewardToken_][account_] = 0;

                // Automatically unwraps the Grow Pool token AKA _rewardToken into the dripToken
                IERC20 _dripToken = IVesperPool(rewardToken_).token();
                uint256 _dripBalanceBefore = _dripToken.balanceOf(address(this));
                IVesperPool(rewardToken_).withdraw(reward_);
                uint256 _dripTokenAmount = _dripToken.balanceOf(address(this)) - _dripBalanceBefore;
                if (address(_dripToken) == address(WETH)) {
                    WETH.withdraw(_dripTokenAmount);
                    Address.sendValue(payable(account_), _dripTokenAmount);
                } else {
                    _dripToken.safeTransfer(account_, _dripTokenAmount);
                }
                emit DripRewardPaid(account_, address(_dripToken), _dripTokenAmount);
            }
        } else {
            // Behave as normal PoolRewards, no unwrap needed
            super._claimReward(rewardToken_, account_, reward_);
        }
    }

    /************************************************************************************************
     *                                     Authorized function                                      *
     ***********************************************************************************************/

    /**
     * @notice Notify that reward is added.
     * Also updates reward rate and reward earning period.
     */
    function notifyRewardAmount(
        address rewardToken_,
        uint256 rewardAmount_,
        uint256 rewardDuration_
    ) external override {
        (bool isStrategy, , , , , , , , ) = IVesperPool(pool).strategy(msg.sender);
        require(
            msg.sender == IVesperPool(pool).governor() || (isRewardToken[rewardToken_] && isStrategy),
            "not-authorized"
        );
        super._notifyRewardAmount(rewardToken_, rewardAmount_, rewardDuration_, IVesperPool(pool).totalSupply());
    }

    /**
     * @notice Defines which rewardToken is a growToken
     * @dev growToken is used to check whether to call withdraw
     * from Grow Pool or not
     */
    function updateGrowToken(address newGrowToken_) external onlyAuthorized {
        require(newGrowToken_ != address(0), "grow-token-address-zero");
        require(isRewardToken[newGrowToken_], "grow-token-not-reward-token");
        emit GrowTokenUpdated(growToken, newGrowToken_);
        growToken = newGrowToken_;
    }
}
