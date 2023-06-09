// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "../Compound.sol";
import "../../../interfaces/compound/IComptrollerMultiReward.sol";

/// @title This strategy will deposit collateral token in a Compound Fork on avalanche and Earn Interest
contract CompoundLike is Compound {
    using SafeERC20 for IERC20;

    address internal constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address public rewardDistributor;

    event RewardDistributorUpdated(address indexed _oldRewardDistributor, address indexed _newRewardDistributor);

    constructor(
        address _pool,
        address _swapper,
        address _comptroller,
        address _rewardDistributor,
        address _rewardToken,
        address _receiptToken,
        string memory _name
    ) Compound(_pool, _swapper, _comptroller, _rewardToken, _receiptToken, _name) {
        require(_rewardDistributor != address(0), "invalid-reward-distributor-addr");
        rewardDistributor = _rewardDistributor;
    }

    //solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        // Approve swapper to swap extra wAVAX rewards
        // Except for the case when collateral is wAVAX itself
        if (address(collateralToken) != WAVAX) {
            IERC20(WAVAX).safeApprove(address(swapper), _amount);
        }
    }

    /// @dev Claim Protocol rewards + AVAX and convert them into collateral token.
    function _claimAndSwapRewards() internal override {
        address[] memory _markets = new address[](1);
        _markets[0] = address(cToken);
        ComptrollerMultiReward(address(comptroller)).claimReward(0, address(this), _markets); // Claim protocol rewards
        ComptrollerMultiReward(address(comptroller)).claimReward(1, address(this), _markets); // Claim native AVAX (optional)
        uint256 _rewardAmount = IERC20(rewardToken).balanceOf(address(this));
        if (_rewardAmount > 0) {
            _safeSwapExactInput(rewardToken, address(collateralToken), _rewardAmount);
        }
        uint256 _avaxRewardAmount = address(this).balance;
        if (_avaxRewardAmount > 0) {
            TokenLike(WAVAX).deposit{value: _avaxRewardAmount}();
            if (address(collateralToken) != WAVAX) {
                _safeSwapExactInput(WAVAX, address(collateralToken), _avaxRewardAmount);
            }
        }
    }

    // Updates rewardDistributor of the Compound fork, in case it changes over time
    function updateRewardDistributor(address _newRewardDistributor) external onlyKeeper {
        require(_newRewardDistributor != address(0), "invalid-reward-distributor-addr");
        emit RewardDistributorUpdated(rewardDistributor, _newRewardDistributor);
        rewardDistributor = _newRewardDistributor;
    }
}
