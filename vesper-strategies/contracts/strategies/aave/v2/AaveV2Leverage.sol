// SPDX-License-Identifier: MIT
// Copied from CompoundLeverageStrategy.sol

pragma solidity 0.8.9;

import "../../Strategy.sol";
import "../../../interfaces/aave/IAave.sol";
import "../../FlashLoanHelper.sol";
import "./AaveV2Core.sol";
import "vesper-pools/contracts/Errors.sol";

/// @title This strategy will deposit collateral token in Aave and based on position
/// it will borrow same collateral token. It will use borrowed asset as supply and borrow again.
contract AaveV2Leverage is Strategy, AaveV2Core, FlashLoanHelper {
    using SafeERC20 for IERC20;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.0.0";

    uint256 internal constant MAX_BPS = 10_000; //100%
    uint256 public minBorrowRatio = 5_000; // 50%
    uint256 public maxBorrowRatio = 6_000; // 60%
    uint256 internal constant COLLATERAL_FACTOR_LIMIT = 9_000; // 90%

    address public rewardToken;
    AToken public vdToken; // Variable Debt Token

    event UpdatedBorrowRatio(
        uint256 previousMinBorrowRatio,
        uint256 newMinBorrowRatio,
        uint256 previousMaxBorrowRatio,
        uint256 newMaxBorrowRatio
    );

    constructor(
        address pool_,
        address swapManager_,
        address rewardToken_,
        address aaveAddressesProvider_,
        address receiptToken_,
        string memory name_
    ) Strategy(pool_, swapManager_, receiptToken_) FlashLoanHelper(aaveAddressesProvider_) AaveV2Core(receiptToken_) {
        NAME = name_;
        rewardToken = rewardToken_;
        (, , address vdToken_) = aaveProtocolDataProvider.getReserveTokensAddresses(
            address(IVesperPool(pool_).token())
        );
        vdToken = AToken(vdToken_);
    }

    /**
     * @notice Current borrow ratio, calculated as current borrow divide by supply.
     * Return value is based on basis points, i.e. 7500 = 75% ratio
     */
    function currentBorrowRatio() external view returns (uint256) {
        (uint256 _supply, uint256 _borrow) = getPosition();
        return _borrow == 0 ? 0 : (_borrow * MAX_BPS) / _supply;
    }

    /// @notice Return supply and borrow position. Position may return few block old value
    function getPosition() public view returns (uint256 _supply, uint256 _borrow) {
        _supply = aToken.balanceOf(address(this));
        _borrow = vdToken.balanceOf(address(this));
    }

    function isReservedToken(address token_) public view override returns (bool) {
        return token_ == address(aToken) || token_ == address(collateralToken);
    }

    /// @inheritdoc Strategy
    function tvl() public view virtual override returns (uint256) {
        (uint256 _supply, uint256 _borrow) = getPosition();
        return collateralToken.balanceOf(address(this)) + _supply - _borrow;
    }

    /**
     *  Adjust position by normal leverage and deleverage.
     * @param adjustBy_ Amount by which we want to increase or decrease _borrow
     * @param shouldRepay_ True indicate we want to deleverage
     * @return _amount Actual adjusted amount
     */
    function _adjustPosition(uint256 adjustBy_, bool shouldRepay_) internal returns (uint256 _amount) {
        // We can get position via view function, as this function will be called after _calculateDesiredPosition
        (uint256 _supply, uint256 _borrow) = getPosition();

        // If no borrow then there is nothing to deleverage
        if (_borrow == 0 && shouldRepay_) {
            return 0;
        }

        if (shouldRepay_) {
            _amount = _normalDeleverage(adjustBy_, _supply, _borrow, _getCollateralFactor());
        } else {
            _amount = _normalLeverage(adjustBy_, _supply, _borrow, _getCollateralFactor());
        }
    }

    /// @notice Approve all required tokens
    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(aToken), amount_);
        IERC20(rewardToken).safeApprove(address(swapper), amount_);
        FlashLoanHelper._approveToken(address(collateralToken), amount_);
    }

    /**
     * @notice Claim rewardToken and transfer to new strategy
     * @param newStrategy_ Address of new strategy.
     */
    function _beforeMigration(address newStrategy_) internal virtual override {
        require(IStrategy(newStrategy_).token() == address(aToken), Errors.WRONG_RECEIPT_TOKEN);
        minBorrowRatio = 0;
        // It will calculate amount to repay based on borrow limit and payback all
        _deposit();
    }

    function _borrowCollateral(uint256 amount_) internal virtual {
        // 2 for variable rate borrow, 0 for referralCode
        aaveLendingPool.borrow(address(collateralToken), amount_, 2, 0, address(this));
    }

    /**
     * @notice Calculate borrow position based on borrow ratio, current supply, borrow, amount
     * being deposited or withdrawn.
     * @param amount_ Collateral amount
     * @param isDeposit_ Flag indicating whether we are depositing amount_ or withdrawing
     * @return _position Amount of borrow that need to be adjusted
     * @return _shouldRepay Flag indicating whether _position is borrow amount or repay amount
     */
    function _calculateDesiredPosition(
        uint256 amount_,
        bool isDeposit_
    ) internal view returns (uint256 _position, bool _shouldRepay) {
        (uint256 _totalSupply, uint256 _totalBorrow) = getPosition();

        // If minimum borrow limit set to 0 then repay borrow
        if (minBorrowRatio == 0) {
            return (_totalBorrow, true);
        }

        uint256 _supply = _totalSupply > _totalBorrow ? _totalSupply - _totalBorrow : 0;

        // In case of withdraw, amount_ can be greater than _supply
        uint256 _newSupply = isDeposit_ ? _supply + amount_ : _supply > amount_ ? _supply - amount_ : 0;

        // (supply * borrowRatio)/(BPS - borrowRatio)
        uint256 _borrowUpperBound = (_newSupply * maxBorrowRatio) / (MAX_BPS - maxBorrowRatio);
        uint256 _borrowLowerBound = (_newSupply * minBorrowRatio) / (MAX_BPS - minBorrowRatio);

        // If our current borrow is greater than max borrow allowed, then we will have to repay
        // some to achieve safe position else borrow more.
        if (_totalBorrow > _borrowUpperBound) {
            _shouldRepay = true;
            // If borrow > upperBound then it is greater than lowerBound too.
            _position = _totalBorrow - _borrowLowerBound;
        } else if (_totalBorrow < _borrowLowerBound) {
            _shouldRepay = false;
            // We can borrow more.
            _position = _borrowLowerBound - _totalBorrow;
        }
    }

    /// @dev Claim Aave rewards
    function _claimRewards() internal override returns (address, uint256) {
        return (AAVE, _claimAave());
    }

    /// @notice Deposit collateral in Aave and adjust borrow position
    function _deposit() internal {
        uint256 _collateralBalance = collateralToken.balanceOf(address(this));
        (uint256 _position, bool _shouldRepay) = _calculateDesiredPosition(_collateralBalance, true);
        // Supply collateral to aave.
        _mint(_collateralBalance);

        // During reinvest, _shouldRepay will be false which indicate that we will borrow more.
        _position -= _doFlashLoan(_position, _shouldRepay);

        uint256 i;
        // 6 iterations should be enough to adjustPosition based on math being used for position calculation.
        while (_position > 0 && i <= 6) {
            unchecked {
                _position -= _adjustPosition(_position, _shouldRepay);
                i++;
            }
        }
    }

    /**
     * @dev Aave flash is used only for withdrawal due to high fee compare to DyDx
     * @param flashAmount_ Amount for flash loan
     * @param shouldRepay_ Flag indicating we want to leverage or deleverage
     * @return Total amount we leverage or deleverage using flash loan
     */
    function _doFlashLoan(uint256 flashAmount_, bool shouldRepay_) internal returns (uint256) {
        uint256 _totalFlashAmount;
        // Due to less fee DyDx is our primary flash loan provider
        if (isDyDxActive && flashAmount_ > 0) {
            _totalFlashAmount = _doDyDxFlashLoan(
                address(collateralToken),
                flashAmount_,
                abi.encode(flashAmount_, shouldRepay_)
            );
            flashAmount_ -= _totalFlashAmount;
        }
        if (isAaveActive && shouldRepay_ && flashAmount_ > 0) {
            _totalFlashAmount += _doAaveFlashLoan(
                address(collateralToken),
                flashAmount_,
                abi.encode(flashAmount_, shouldRepay_)
            );
        }
        return _totalFlashAmount;
    }

    /**
     * @notice This function will be called by flash loan
     * @dev In case of borrow, DyDx is preferred as fee is so low that it does not effect
     * our collateralRatio and liquidation risk.
     */
    function _flashLoanLogic(bytes memory data_, uint256 repayAmount_) internal override {
        (uint256 _amount, bool _deficit) = abi.decode(data_, (uint256, bool));
        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        require(_collateralHere >= _amount, "FLASH_FAILED"); // to stop malicious calls

        //if in deficit we repay amount and then withdraw
        if (_deficit) {
            _repayBorrow(_amount);
            //if we are withdrawing we take more to cover fee
            _redeemUnderlying(repayAmount_);
        } else {
            _mint(_collateralHere);
            //borrow more to cover fee
            _borrowCollateral(repayAmount_);
        }
    }

    /**
     * @dev Generate report for pools accounting and also send profit and any payback to pool.
     */
    function _generateReport() internal returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        (, , , , uint256 _totalDebt, , , uint256 _debtRatio, ) = IVesperPool(pool).strategy(address(this));

        (uint256 _supply, uint256 _borrow) = getPosition();

        uint256 _investedCollateral = _supply - _borrow;

        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        uint256 _totalCollateral = _investedCollateral + _collateralHere;

        if (_totalCollateral > _totalDebt) {
            _profit = _totalCollateral - _totalDebt;
        } else {
            _loss = _totalDebt - _totalCollateral;
        }
        uint256 _profitAndExcessDebt = _profit + _excessDebt;
        if (_collateralHere < _profitAndExcessDebt) {
            uint256 _totalAmountToWithdraw = Math.min((_profitAndExcessDebt - _collateralHere), _investedCollateral);
            if (_totalAmountToWithdraw > 0) {
                _withdrawHere(_totalAmountToWithdraw);
                _collateralHere = collateralToken.balanceOf(address(this));
            }
        }

        // Make sure _collateralHere >= _payback + profit. set actual payback first and then profit
        _payback = Math.min(_collateralHere, _excessDebt);
        _profit = _collateralHere > _payback ? Math.min((_collateralHere - _payback), _profit) : 0;

        // Handle scenario if debtRatio is zero and some supply left.
        // Remaining tokens are profit.
        if (_debtRatio == 0) {
            (_supply, _borrow) = getPosition();
            if (_supply > 0 && _borrow == 0) {
                _redeemUnderlying(_supply);
                _profit += _supply;
            }
        }
    }

    /**
     * @notice Get Collateral Factor (Loan to Value Ratio). The ltvRatio/_collateralFactor is in 1e4 decimals.
     */
    function _getCollateralFactor() internal view virtual returns (uint256 _collateralFactor) {
        (, uint256 _ltvRatio, , , , , , , , ) = aaveProtocolDataProvider.getReserveConfigurationData(
            address(collateralToken)
        );
        _collateralFactor = (_ltvRatio * COLLATERAL_FACTOR_LIMIT) / MAX_BPS;
    }

    /**
     * @dev Aave support WETH as collateral.
     */
    function _mint(uint256 amount_) internal virtual {
        _deposit(address(collateralToken), amount_);
    }

    /**
     * Deleverage: Reduce borrow to achieve safe position
     * @param maxDeleverage_ Reduce borrow by this amount
     * @return _deleveragedAmount Amount we actually reduced
     */
    function _normalDeleverage(
        uint256 maxDeleverage_,
        uint256 supply_,
        uint256 borrow_,
        uint256 collateralFactor_
    ) internal returns (uint256 _deleveragedAmount) {
        uint256 _theoreticalSupply;
        if (collateralFactor_ > 0) {
            // Calculate minimum supply required to support borrow_
            _theoreticalSupply = (borrow_ * MAX_BPS) / collateralFactor_;
        }
        _deleveragedAmount = supply_ - _theoreticalSupply;
        if (_deleveragedAmount >= borrow_) {
            _deleveragedAmount = borrow_;
        }
        if (_deleveragedAmount >= maxDeleverage_) {
            _deleveragedAmount = maxDeleverage_;
        }
        _redeemUnderlying(_deleveragedAmount);
        _repayBorrow(_deleveragedAmount);
    }

    /**
     * Leverage: Borrow more
     * @param maxLeverage_ Max amount to borrow
     * @return _leveragedAmount Amount we actually borrowed
     */
    function _normalLeverage(
        uint256 maxLeverage_,
        uint256 supply_,
        uint256 borrow_,
        uint256 collateralFactor_
    ) internal returns (uint256 _leveragedAmount) {
        // Calculate maximum we can borrow at current supply_
        _leveragedAmount = ((supply_ * collateralFactor_) / MAX_BPS) - borrow_;
        if (_leveragedAmount >= maxLeverage_) {
            _leveragedAmount = maxLeverage_;
        }
        _borrowCollateral(_leveragedAmount);
        _mint(collateralToken.balanceOf(address(this)));
    }

    function _rebalance() internal override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        (_profit, _loss, _payback) = _generateReport();
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
        _deposit();
    }

    function _redeemUnderlying(uint256 amount_) internal virtual {
        _withdraw(address(collateralToken), address(this), amount_);
    }

    function _repayBorrow(uint256 amount_) internal virtual {
        aaveLendingPool.repay(address(collateralToken), amount_, 2, address(this));
    }

    /// @dev Withdraw collateral here. Do not transfer to pool
    function _withdrawHere(uint256 amount_) internal override {
        (uint256 _position, bool _shouldRepay) = _calculateDesiredPosition(amount_, false);
        if (_shouldRepay) {
            // Do deleverage by flash loan
            _position -= _doFlashLoan(_position, _shouldRepay);

            // If we still have _position to deleverage do it via normal deleverage
            uint256 i;
            // 6 iterations should be enough to adjustPosition based on math being used for position calculation.
            while (_position > 0 && i <= 6) {
                unchecked {
                    _position -= _adjustPosition(_position, true);
                    i++;
                }
            }

            (uint256 _supply, uint256 _borrow) = getPosition();
            // There may be scenario where we are not able to deleverage enough
            if (_position > 0) {
                // Calculate redeemable at current borrow and supply.
                uint256 _supplyToSupportBorrow;
                if (maxBorrowRatio > 0) {
                    _supplyToSupportBorrow = (_borrow * MAX_BPS) / maxBorrowRatio;
                }
                // Current supply minus supply required to support _borrow at _maxBorrowRatio
                uint256 _redeemable = _supply - _supplyToSupportBorrow;
                if (amount_ > _redeemable) {
                    amount_ = _redeemable;
                }
            }
            // Position is 0 and amount > supply due to deleverage
            else if (amount_ > _supply) {
                amount_ = _supply;
            }
        }

        _redeemUnderlying(amount_);
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    /**
     * @notice Update upper and lower borrow ratio
     * @dev It is possible to set 0 as minBorrowRatio_ to not borrow anything
     * @param minBorrowRatio_ Minimum % we want to borrow
     * @param maxBorrowRatio_ Maximum % we want to borrow
     */
    function updateBorrowRatio(uint256 minBorrowRatio_, uint256 maxBorrowRatio_) external onlyGovernor {
        require(maxBorrowRatio_ < _getCollateralFactor(), Errors.INVALID_MAX_BORROW_LIMIT);
        require(maxBorrowRatio_ > minBorrowRatio_, Errors.MAX_LIMIT_LESS_THAN_MIN);
        emit UpdatedBorrowRatio(minBorrowRatio, minBorrowRatio_, maxBorrowRatio, maxBorrowRatio_);
        minBorrowRatio = minBorrowRatio_;
        maxBorrowRatio = maxBorrowRatio_;
    }

    function updateFlashLoanStatus(bool dydxStatus_, bool aaveStatus_) external virtual onlyGovernor {
        _updateDyDxStatus(dydxStatus_, address(collateralToken));
        _updateAaveStatus(aaveStatus_);
    }
}
