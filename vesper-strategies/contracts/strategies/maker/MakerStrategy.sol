// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/utils/math/Math.sol";
import "../Strategy.sol";
import "../../interfaces/vesper/ICollateralManager.sol";

/// @title This strategy will deposit collateral token in Maker, borrow Dai and
/// deposit borrowed DAI in other lending pool to earn interest.
abstract contract MakerStrategy is Strategy {
    using SafeERC20 for IERC20;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.0.0";

    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    ICollateralManager public immutable cm;
    bytes32 public immutable collateralType;
    uint256 public highWater;
    uint256 public lowWater;
    uint256 public decimalConversionFactor;
    uint256 private constant WAT = 10**16;

    constructor(
        address _pool,
        address _cm,
        address _swapper,
        address _receiptToken,
        bytes32 _collateralType,
        uint256 _highWater,
        uint256 _lowWater,
        string memory _name
    ) Strategy(_pool, _swapper, _receiptToken) {
        require(_cm != address(0), "cm-address-is-zero");
        collateralType = _collateralType;
        cm = ICollateralManager(_cm);
        _updateBalancingFactor(_highWater, _lowWater);
        // Assuming token supports 18 or less decimals.
        uint256 _decimals = IERC20Metadata(address(IVesperPool(_pool).token())).decimals();
        decimalConversionFactor = 10**(18 - _decimals);
        NAME = _name;
    }

    /// @notice Convert from 18 decimals to token defined decimals.
    function convertFrom18(uint256 _amount) public view returns (uint256) {
        return _amount / decimalConversionFactor;
    }

    /// @notice Check whether given token is reserved or not. Reserved tokens are not allowed to sweep.
    function isReservedToken(address _token) public view virtual override returns (bool) {
        return _token == receiptToken || _token == address(collateralToken);
    }

    /**
     * @notice Returns true if pool is underwater.
     * @notice Underwater - If debt is greater than (earning of pool + DAI in pool + some wei buffer).
     * @notice Earning - Sum of DAI balance and DAI from accrued reward, if any, in lending pool.
     */
    function isUnderwater() public view virtual returns (bool) {
        return cm.getVaultDebt(address(this)) > (_getDaiBalance() + IERC20(DAI).balanceOf(address(this)));
    }

    /// @notice Returns total collateral locked in the strategy
    function tvl() external view override returns (uint256) {
        return convertFrom18(cm.getVaultBalance(address(this))) + collateralToken.balanceOf(address(this));
    }

    function vaultNum() external view returns (uint256) {
        return cm.vaultNum(address(this));
    }

    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        IERC20(DAI).safeApprove(address(cm), _amount);
        collateralToken.safeApprove(address(cm), _amount);
        collateralToken.safeApprove(address(swapper), _amount);
        IERC20(DAI).safeApprove(address(swapper), _amount);
    }

    /**
     * @dev It will be called during migration. Transfer Maker vault ownership to new strategy
     * @param _newStrategy Address of new strategy.
     */
    function _beforeMigration(address _newStrategy) internal virtual override {
        require(MakerStrategy(_newStrategy).collateralType() == collateralType, "collateral-type-must-be-the-same");
        cm.transferVaultOwnership(_newStrategy);
    }

    function _calculateSafeBorrowPosition(uint256 _payback)
        internal
        view
        returns (
            uint256 _daiToRepay,
            uint256 _daiToBorrow,
            uint256 _currentDaiDebt
        )
    {
        // 1. collateralUSDRate increase and excessDebt > 0. Even withdrawing some collateral, strategy can borrow more DAI due to high collateral USD rate
        // 2. collateralUSDRate deceased and excessDebt = 0. Strategy may have to payback DAI if it is below low water
        // 3. Not much change in collateralUSDRate but due to excessDebt, strategy may have to payback DAI.
        // 4. Governor change highWater and lowWater. This impact DAI to repay or DAI to borrow
        uint256 _collateralLocked;
        uint256 _collateralUsdRate;
        uint256 _minimumDebt;
        (_collateralLocked, _currentDaiDebt, _collateralUsdRate, , _minimumDebt) = cm.whatWouldWithdrawDo(
            address(this),
            _payback
        );
        uint256 _safeDebt = (_collateralLocked * _collateralUsdRate) / highWater;
        if (_safeDebt < _minimumDebt) {
            _daiToRepay = _currentDaiDebt;
        } else {
            uint256 _unSafeDebt = (_collateralLocked * _collateralUsdRate) / lowWater;
            if (_currentDaiDebt > _unSafeDebt) {
                // Being below low water brings risk of liquidation in Maker.
                // Withdraw DAI from Lender and deposit in Maker
                // highWater > lowWater hence _safeDebt < unSafeDebt
                _daiToRepay = _currentDaiDebt - _safeDebt;
            } else if (_currentDaiDebt < _safeDebt) {
                _daiToBorrow = _safeDebt - _currentDaiDebt;
            }
        }
    }

    function _depositDaiToLender(uint256 _amount) internal virtual;

    function _getDaiBalance() internal view virtual returns (uint256);

    function _moveDaiToMaker(uint256 _amount) internal {
        if (_amount > 0) {
            _withdrawDaiFromLender(_amount);
            cm.payback(_amount);
        }
    }

    function _rebalance()
        internal
        override
        returns (
            uint256 _profit,
            uint256 _loss,
            uint256 _payback
        )
    {
        _payback = IVesperPool(pool).excessDebt(address(this));
        if (_payback == 0) {
            // If strategy is suppose to get more fund from pool, this method fetch it.
            IVesperPool(pool).reportEarning(0, 0, 0);
        }

        // Deposit available collateral to Maker vault. This will improve collateral ratio
        uint256 _collateralHere = collateralToken.balanceOf(address(this));
        if (_collateralHere > 0) {
            //FIXME: if some collateral sent to this contract , it is not counted as profit and not return to pool. This remains in vault forever.
            cm.depositCollateral(_collateralHere);
        }
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));
        uint256 _collateralInVault = cm.getVaultBalance(address(this));
        // When strategy was making loss in DAI and resurface() method called then it reduce collateral in vault. Ref _resurface();
        if (_totalDebt > _collateralInVault) {
            _loss = _totalDebt - _collateralInVault;
        }

        (uint256 _daiToRepay, uint256 _daiToBorrow, uint256 _currentDaiDebt) = _calculateSafeBorrowPosition(_payback);

        uint256 _daiBalance = _getDaiBalance();
        // This contract is not suppose to hold any borrowed DAI. If any DAI received from rewards, donation etc is profit.
        uint256 _profitInDai;
        uint256 _daiToWithdraw = _daiToRepay;
        if (_daiBalance > _currentDaiDebt) {
            // Yield generated in DAI.
            _profitInDai = _daiBalance - _currentDaiDebt;
            _daiToWithdraw += _profitInDai;
        }
        // Contract may have some DAI here from rewards or from Maker. Use this DAI for profit.
        _profitInDai += IERC20(DAI).balanceOf(address(this));
        if (_daiToWithdraw > 0) {
            // This can withdraw less than requested amount.  This is not problem as long as Dai here >= _daiToRepay. Profit earned in DAI can be reused for _daiToRepay.
            _withdrawDaiFromLender(_daiToWithdraw);
        }

        if (_daiToRepay > 0) {
            cm.payback(_daiToRepay);
        } else if (_daiToBorrow > 100e18) {
            cm.borrow(_daiToBorrow);
        }
        // Dai paid back by now. Good to withdraw excessDebt in collateral.
        if (_payback > 0) {
            cm.withdrawCollateral(_payback);
        }

        // DAI: profit DAI, borrowed DAI, repay DAI.
        // Collateral token: excessDebt, profit in collateral if any

        // All remaining dai here is not profit. some part is borrowed dai.
        _profitInDai = Math.min(_profitInDai, IERC20(DAI).balanceOf(address(this)));
        if (_profitInDai > 0) {
            // calling safeSwap to not revert in case profit conversion to collateralToken fails. Let Dai remains here. It doesn't harm overall.
            _safeSwapExactInput(DAI, address(collateralToken), _profitInDai);
        }
        // Remaining Dai here are actually borrowed DAI or leftover profit. Deposit it for yield generation
        uint256 _daiBalanceHere = IERC20(DAI).balanceOf(address(this));

        if (_daiBalanceHere > 0) {
            _depositDaiToLender(_daiBalanceHere);
        }

        _collateralHere = collateralToken.balanceOf(address(this));
        if (_collateralHere > _payback) {
            _profit = _collateralHere - _payback;
        }

        // Adjust past loss and current profit here itself if possible.
        if (_profit >= _loss) {
            _profit = _profit - _loss;
            _loss = 0;
        } else {
            // Loss > profit
            _loss = _loss - _profit;
            _profit = 0;
        }

        // Pool expect this contract has _profit + _payback in the contract. This method would revert if collateral.balanceOf(strategy) < (_profit + _excessDebt);
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);
    }

    function _resurface() internal virtual {
        require(isUnderwater(), "pool-is-above-water");
        uint256 _daiNeeded = cm.getVaultDebt(address(this)) - _getDaiBalance();
        uint256 _collateralNeeded = swapper.getAmountIn(address(collateralToken), DAI, _daiNeeded);
        if (_collateralNeeded > 0) {
            cm.withdrawCollateral(_collateralNeeded);
            swapper.swapExactOutput(address(collateralToken), DAI, _daiNeeded, _collateralNeeded, address(this));
            cm.payback(IERC20(DAI).balanceOf(address(this)));
            IVesperPool(pool).reportLoss(_collateralNeeded);
        }
    }

    function _updateBalancingFactor(uint256 _highWater, uint256 _lowWater) internal {
        require(_lowWater > 0, "lowWater-is-zero");
        require(_highWater > _lowWater, "highWater-less-than-lowWater");
        highWater = _highWater * WAT;
        lowWater = _lowWater * WAT;
    }

    function _withdrawDaiFromLender(uint256 _amount) internal virtual;

    function _withdrawHere(uint256 _amount) internal override {
        (
            uint256 collateralLocked,
            uint256 debt,
            uint256 collateralUsdRate,
            uint256 collateralRatio,
            uint256 minimumDebt
        ) = cm.whatWouldWithdrawDo(address(this), _amount);
        if (debt > 0 && collateralRatio < lowWater) {
            // If this withdraw results in Low Water scenario.
            uint256 maxDebt = (collateralLocked * collateralUsdRate) / highWater;
            if (maxDebt < minimumDebt) {
                // This is Dusting scenario
                _moveDaiToMaker(debt);
            } else if (maxDebt < debt) {
                _moveDaiToMaker(debt - maxDebt);
            }
        }
        cm.withdrawCollateral(_amount);
    }

    /******************************************************************************
     *                            Admin functions                              *
     *****************************************************************************/

    /// @notice Create new Maker vault
    function createVault() external onlyGovernor {
        cm.createVault(collateralType);
    }

    /**
     * @dev If pool is underwater this function will resolve underwater condition.
     * If Debt in Maker is greater than Dai balance in lender then pool is underwater.
     * Lowering DAI debt in Maker will resolve underwater condition.
     * Resolve: Calculate required collateral token to lower DAI debt. Withdraw required
     * collateral token from Maker and convert those to DAI via Uniswap.
     * Finally payback debt in Maker using DAI.
     * @dev Also report loss in pool.
     */
    function resurface() external onlyKeeper {
        _resurface();
    }

    /**
     * @notice Update balancing factors aka high water and low water values.
     * Water mark values represent Collateral Ratio in Maker. For example 300 as high water
     * means 300% collateral ratio.
     * @param _highWater Value for high water mark.
     * @param _lowWater Value for low water mark.
     */
    function updateBalancingFactor(uint256 _highWater, uint256 _lowWater) external onlyGovernor {
        _updateBalancingFactor(_highWater, _lowWater);
    }
}
