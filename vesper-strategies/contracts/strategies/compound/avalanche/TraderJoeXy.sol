// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "../CompoundXyCore.sol";
import "../../../interfaces/compound/IComptrollerMultiReward.sol";

/// @title This strategy will deposit collateral token in TraderJoe and based on position it will borrow
/// another token. Supply X borrow Y and keep borrowed amount here. It does handle rewards from TraderJoe
contract TraderJoeXy is CompoundXyCore {
    using SafeERC20 for IERC20;

    address public immutable rewardToken;
    address internal constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

    constructor(
        address _pool,
        address _swapManager,
        address _comptroller,
        address _rewardToken,
        address _receiptToken,
        address _borrowCToken,
        string memory _name
    ) CompoundXyCore(_pool, _swapManager, _comptroller, _receiptToken, _borrowCToken, _name) {
        require(_rewardToken != address(0), "rewardToken-address-is-zero");
        rewardToken = _rewardToken;
    }

    //solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        IERC20(rewardToken).safeApprove(address(swapper), _amount);
        // Parent contract is approving collateral so skip if WAVAX is collateral.
        if (address(collateralToken) != WAVAX) {
            IERC20(WAVAX).safeApprove(address(swapper), _amount);
        }
    }

    function _claimRewardsAndConvertTo(address _toToken) internal override {
        address[] memory _markets = new address[](2);
        _markets[0] = address(supplyCToken);
        _markets[1] = address(borrowCToken);
        ComptrollerMultiReward(address(comptroller)).claimReward(0, address(this), _markets); // Claim protocol rewards
        ComptrollerMultiReward(address(comptroller)).claimReward(1, address(this), _markets); // Claim native AVAX (optional)

        uint256 _rewardAmount = IERC20(rewardToken).balanceOf(address(this));
        if (_rewardAmount > 0) {
            _safeSwapExactInput(rewardToken, _toToken, _rewardAmount);
        }
        uint256 _avaxRewardAmount = address(this).balance;
        if (_avaxRewardAmount > 0) {
            TokenLike(WAVAX).deposit{value: _avaxRewardAmount}();
            _safeSwapExactInput(WAVAX, _toToken, _avaxRewardAmount);
        }
    }

    /// @dev TraderJoe has different markets API hence overriding this method.
    function _getCollateralFactor(address _cToken) internal view override returns (uint256 _collateralFactor) {
        (, _collateralFactor, ) = TraderJoeComptroller(address(comptroller)).markets(_cToken);
    }
}
