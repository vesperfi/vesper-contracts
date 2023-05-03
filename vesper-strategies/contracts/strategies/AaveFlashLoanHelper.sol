// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import "vesper-pools/contracts/Errors.sol";
import "../interfaces/aave/IAave.sol";

/**
 * @title FlashLoanHelper:: This contract does all heavy lifting to get flash loan via Aave.
 * @dev End user has to override _flashLoanLogic() function to perform logic after flash loan is done.
 *      Also needs to approve token to Aave via _approveToken function.
 *      1 utility internal function is also provided to activate/deactivate flash loan.
 *      Utility function is provided as internal so that end user can choose controlled access via public function.
 */
abstract contract AaveFlashLoanHelper {
    using SafeERC20 for IERC20;

    PoolAddressesProviderV3 internal poolAddressesProvider;

    bool public isAaveActive = false;

    constructor(address _aaveAddressesProvider) {
        require(_aaveAddressesProvider != address(0), Errors.INPUT_ADDRESS_IS_ZERO);
        poolAddressesProvider = PoolAddressesProviderV3(_aaveAddressesProvider);
    }

    function _updateAaveStatus(bool _status) internal {
        isAaveActive = _status;
    }

    /// @notice Approve all required tokens for flash loan
    function _approveToken(address _token, uint256 _amount) internal {
        IERC20(_token).safeApprove(address(poolAddressesProvider.getPool()), _amount);
    }

    /// @dev Override this function to execute logic which uses flash loan amount
    function _flashLoanLogic(bytes memory _data, uint256 _repayAmount) internal virtual;

    /***************************** Aave flash loan functions ***********************************/

    bool private awaitingFlash = false;

    /**
     * @notice This is entry point for Aave flash loan
     * @param _token Token for which we are taking flash loan
     * @param _amountDesired Flash loan amount
     * @param _data This will be passed downstream for processing. It can be empty.
     */
    function _doAaveFlashLoan(
        address _token,
        uint256 _amountDesired,
        bytes memory _data
    ) internal returns (uint256 _amount) {
        require(isAaveActive, Errors.AAVE_FLASH_LOAN_NOT_ACTIVE);
        // Check token liquidity in Aave
        (address _aToken, , ) = poolAddressesProvider.getPoolDataProvider().getReserveTokensAddresses(_token);
        uint256 _availableLiquidity = IERC20(_token).balanceOf(_aToken);
        if (_amountDesired > _availableLiquidity) {
            _amountDesired = _availableLiquidity;
        }

        address[] memory assets = new address[](1);
        assets[0] = _token;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amountDesired;

        // 0 = no debt, 1 = stable, 2 = variable
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        // Anyone can call aave flash loan to us, so we need some protection
        awaitingFlash = true;

        // function params: receiver, assets, amounts, modes, onBehalfOf, data, referralCode
        poolAddressesProvider.getPool().flashLoan(address(this), assets, amounts, modes, address(this), _data, 0);
        _amount = _amountDesired;
        awaitingFlash = false;
    }

    /// @dev Aave will call this function after doing flash loan
    function executeOperation(
        address[] calldata /*_assets*/,
        uint256[] calldata _amounts,
        uint256[] calldata _premiums,
        address _initiator,
        bytes calldata _data
    ) external returns (bool) {
        require(msg.sender == address(poolAddressesProvider.getPool()), "!aave-pool");
        require(awaitingFlash, Errors.INVALID_FLASH_LOAN);
        require(_initiator == address(this), Errors.INVALID_INITIATOR);

        // Flash loan amount + flash loan fee
        uint256 _repayAmount = _amounts[0] + _premiums[0];
        _flashLoanLogic(_data, _repayAmount);
        return true;
    }

    /***************************** Aave flash loan functions ends ***********************************/
}
