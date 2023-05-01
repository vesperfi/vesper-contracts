// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "../CompoundLeverageBase.sol";
import "../../../interfaces/compound/IComptrollerMultiReward.sol";
import "../../AaveFlashLoanHelper.sol";

// solhint-disable no-empty-blocks

contract SonneLeverage is CompoundLeverageBase, AaveFlashLoanHelper {
    using SafeERC20 for IERC20;

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
        AaveFlashLoanHelper(_aaveAddressesProvider)
    {}

    //solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    /// @notice Approve all required tokens
    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        AaveFlashLoanHelper._approveToken(address(collateralToken), _amount);
    }

    /// @notice Claim comp
    function _claimRewards() internal override returns (address, uint256) {
        address[] memory _markets = new address[](1);
        _markets[0] = address(cToken);
        comptroller.claimComp(address(this), _markets);
        return (rewardToken, IERC20(rewardToken).balanceOf(address(this)));
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
