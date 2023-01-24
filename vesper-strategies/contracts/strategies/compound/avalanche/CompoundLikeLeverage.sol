// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "../CompoundLeverageBase.sol";
import "../../../interfaces/compound/IComptrollerMultiReward.sol";
import "../../AvalancheFlashLoanHelper.sol";

// solhint-disable no-empty-blocks

contract CompoundLikeLeverage is CompoundLeverageBase, AvalancheFlashLoanHelper {
    using SafeERC20 for IERC20;

    address internal constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;

    constructor(
        address _pool,
        address _swapManager,
        address _comptroller,
        address _rewardToken,
        address _aaveAddressesProvider,
        address _receiptToken,
        string memory _name
    )
        CompoundLeverageBase(_pool, _swapManager, _comptroller, _rewardToken, _receiptToken, _name)
        AvalancheFlashLoanHelper(_aaveAddressesProvider)
    {}

    //solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        IERC20(WAVAX).safeApprove(address(swapper), _amount);
        AvalancheFlashLoanHelper._approveToken(address(collateralToken), _amount);
    }

    /// @dev Claim Protocol rewards + AVAX and convert them into collateral token.
    function _claimAndSwapRewards() internal override {
        ComptrollerMultiReward(address(comptroller)).claimReward(0, address(this)); // Claim protocol rewards
        ComptrollerMultiReward(address(comptroller)).claimReward(1, address(this)); // Claim native AVAX (optional)
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

    /**
     * @dev Aave flash is used only for withdrawal due to fee
     * @param _flashAmount Amount for flash loan
     * @param _shouldRepay Flag indicating we want to leverage or deleverage
     * @return Total amount we leverage or deleverage using flash loan
     */
    function _doFlashLoan(uint256 _flashAmount, bool _shouldRepay) internal override returns (uint256) {
        uint256 _totalFlashAmount;

        if (isAaveActive && _shouldRepay && _flashAmount > 0) {
            bytes memory _data = abi.encode(_flashAmount, _shouldRepay);
            _totalFlashAmount += _doAaveFlashLoan(address(collateralToken), _flashAmount, _data);
        }
        return _totalFlashAmount;
    }

    /**
     * @notice This function will be called by flash loan
     * @dev In case of borrow, DyDx is preferred as fee is so low that it does not effect
     * our collateralRatio and liquidation risk.
     */
    function _flashLoanLogic(bytes memory _data, uint256 _repayAmount) internal override {
        (uint256 _amount, bool _deficit) = abi.decode(_data, (uint256, bool));
        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        require(_collateralHere >= _amount, "FLASH_FAILED"); // to stop malicious calls

        //if in deficit we repay amount and then withdraw
        if (_deficit) {
            _repayBorrow(_amount);
            //if we are withdrawing we take more to cover fee
            _redeemUnderlying(_repayAmount);
        } else {
            _mint(_collateralHere);
            //borrow more to cover fee
            _borrowCollateral(_repayAmount);
        }
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    function updateAaveStatus(bool _status) external onlyGovernor {
        _updateAaveStatus(_status);
    }
}
