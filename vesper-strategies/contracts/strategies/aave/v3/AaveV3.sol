// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "vesper-pools/contracts/Errors.sol";
import "./AaveV3Incentive.sol";
import "../../Strategy.sol";
import "../../../interfaces/aave/IAave.sol";
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/utils/math/Math.sol";

/// @dev This strategy will deposit collateral token in Aave and earn interest.
contract AaveV3 is Strategy {
    using SafeERC20 for IERC20;
    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.0.0";
    PoolAddressesProvider public immutable aaveAddressProvider;

    constructor(
        address _pool,
        address _swapper,
        address _receiptToken,
        address _aaveAddressProvider,
        string memory _name
    ) Strategy(_pool, _swapper, _receiptToken) {
        NAME = _name;
        require(_aaveAddressProvider != address(0), "addressProvider-is-zero");
        require(
            AToken(_receiptToken).UNDERLYING_ASSET_ADDRESS() == address(IVesperPool(_pool).token()),
            "invalid-receipt-token"
        );
        aaveAddressProvider = PoolAddressesProvider(_aaveAddressProvider);
    }

    function isReservedToken(address _token) public view override returns (bool) {
        return receiptToken == _token || address(collateralToken) == _token;
    }

    /**
     * @notice Report total value locked in this strategy
     * @dev aToken and collateral are 1:1
     */
    function tvl() public view virtual override returns (uint256 _tvl) {
        // receiptToken is aToken
        _tvl = IERC20(receiptToken).balanceOf(address(this)) + collateralToken.balanceOf(address(this));
    }

    /// @notice Large approval of token
    function _approveToken(uint256 _amount) internal override {
        super._approveToken(_amount);
        collateralToken.safeApprove(aaveAddressProvider.getPool(), _amount);
        try AToken(receiptToken).getIncentivesController() returns (address _aaveIncentivesController) {
            address[] memory _rewardTokens = AaveIncentivesController(_aaveIncentivesController).getRewardsList();
            for (uint256 i; i < _rewardTokens.length; ++i) {
                IERC20(_rewardTokens[i]).safeApprove(address(swapper), _amount);
            }
            //solhint-disable no-empty-blocks
        } catch {}
    }

    //solhint-disable no-empty-blocks
    function _beforeMigration(address _newStrategy) internal override {}

    /// @notice Claim all rewards and convert to _toToken.
    function _claimRewardsAndConvertTo(address _toToken) internal {
        (address[] memory _tokens, uint256[] memory _amounts) = AaveV3Incentive._claimRewards(receiptToken);
        uint256 _length = _tokens.length;
        for (uint256 i; i < _length; ++i) {
            if (_amounts[i] > 0) {
                _safeSwapExactInput(_tokens[i], _toToken, _amounts[i]);
            }
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
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        // Claim any reward we have.
        _claimRewardsAndConvertTo(address(collateralToken));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));

        uint256 _totalCollateral = IERC20(receiptToken).balanceOf(address(this)) + _collateralHere;

        if (_totalCollateral > _totalDebt) {
            _profit = _totalCollateral - _totalDebt;
        } else {
            _loss = _totalDebt - _totalCollateral;
        }
        uint256 _profitAndExcessDebt = _profit + _excessDebt;
        if (_profitAndExcessDebt > _collateralHere) {
            _withdrawHere(_profitAndExcessDebt - _collateralHere);
            _collateralHere = collateralToken.balanceOf(address(this));
        }

        // Make sure _collateralHere >= _payback + profit. set actual payback first and then profit
        _payback = Math.min(_collateralHere, _excessDebt);
        _profit = _collateralHere > _payback ? Math.min((_collateralHere - _payback), _profit) : 0;
        IVesperPool(pool).reportEarning(_profit, _loss, _payback);

        // strategy may get new fund. deposit to generate yield
        _collateralHere = collateralToken.balanceOf(address(this));
        if (_collateralHere > 0) {
            AaveLendingPool(aaveAddressProvider.getPool()).supply(
                address(collateralToken),
                _collateralHere,
                address(this),
                0
            );
        }
    }

    /// @dev Withdraw collateral here. Do not transfer to pool
    function _withdrawHere(uint256 _requireAmount) internal override {
        // withdraw asking more than available liquidity will fail. To do safe withdraw, check
        // _requireAmount against available liquidity.
        uint256 _possibleWithdraw = Math.min(
            _requireAmount,
            Math.min(IERC20(receiptToken).balanceOf(address(this)), collateralToken.balanceOf(receiptToken))
        );
        if (_possibleWithdraw > 0) {
            require(
                AaveLendingPool(aaveAddressProvider.getPool()).withdraw(
                    address(collateralToken),
                    _possibleWithdraw,
                    address(this)
                ) == _possibleWithdraw,
                Errors.INCORRECT_WITHDRAW_AMOUNT
            );
        }
    }
}
