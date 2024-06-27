// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {IERC20} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/utils/math/Math.sol";
import {IVesperPool} from "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import {IStrategy, Strategy} from "../../Strategy.sol";
import {IStargatePoolV2 as IStargatePool} from "../../../interfaces/stargate/v2/IStargatePoolV2.sol";
import {IStargateStaking} from "../../../interfaces/stargate/v2/IStargateStaking.sol";

/// @title This Strategy will deposit collateral token in a StargateV2 Pool to yearn yield.
/// Stake LP token to accrue rewards.
contract StargateV2 is Strategy {
    using SafeERC20 for IERC20;

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;
    string public constant VERSION = "5.2.0";

    /// @notice Address of Stargate pool
    IStargatePool internal immutable stargatePool;
    /// @notice Address of Staking contract
    IStargateStaking public immutable stargateStaking;
    /// @dev Stargate LP. Immutable version of receiptToken
    IERC20 internal immutable stargateLp;

    address[] internal rewardTokens;

    constructor(
        address pool_,
        address swapper_,
        IStargatePool stargatePool_,
        IStargateStaking stargateStaking_,
        string memory name_
    ) Strategy(pool_, swapper_, address(0)) {
        require(address(stargatePool_) != address(0), "stargate-pool-is-null");
        require(address(stargateStaking_) != address(0), "stargate-staking-is-null");

        stargatePool = stargatePool_;
        stargateStaking = stargateStaking_;

        address _stargateLp = stargatePool_.lpToken();
        stargateLp = IERC20(_stargateLp);
        receiptToken = _stargateLp;
        rewardTokens = stargateStaking_.rewarder(stargateLp).rewardTokens();
        NAME = name_;
    }

    function getRewardTokens() external view returns (address[] memory) {
        return rewardTokens;
    }

    function isReservedToken(address token_) public view override returns (bool) {
        return token_ == receiptToken;
    }

    function lpAmountStaked() public view returns (uint256 _lpAmountStaked) {
        _lpAmountStaked = stargateStaking.balanceOf(stargateLp, address(this));
    }

    function tvl() external view override returns (uint256) {
        return _getCollateralInStargate() + collateralToken.balanceOf(address(this));
    }

    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        collateralToken.safeApprove(address(stargatePool), amount_);
        stargateLp.safeApprove(address(stargateStaking), amount_);

        uint256 _rewardTokensLength = rewardTokens.length;
        for (uint256 i; i < _rewardTokensLength; ++i) {
            IERC20(rewardTokens[i]).safeApprove(address(swapper), amount_);
        }
    }

    /**
     * @dev Before migration hook.
     */
    function _beforeMigration(address newStrategy_) internal override {
        require(IStrategy(newStrategy_).token() == receiptToken, "wrong-receipt-token");
        stargateStaking.withdraw(stargateLp, lpAmountStaked());
    }

    function _claimAndSwapRewards() internal virtual override {
        _claimRewards();
        uint256 _rewardTokensLength = rewardTokens.length;
        for (uint256 i; i < _rewardTokensLength; ++i) {
            address _rewardToken = rewardTokens[i];
            uint256 _amountIn = IERC20(_rewardToken).balanceOf(address(this));
            if (_amountIn > 0) {
                _safeSwapExactInput(_rewardToken, address(collateralToken), _amountIn);
            }
        }
    }

    /// @dev Claim rewards from Staking contract
    /// @dev Return values are not being used hence returning 0
    function _claimRewards() internal override returns (address, uint256) {
        IERC20[] memory _lpTokens = new IERC20[](1);
        _lpTokens[0] = stargateLp;
        stargateStaking.claim(_lpTokens);
        return (address(0), 0);
    }

    function _deposit(uint256 collateralAmount_) internal virtual {
        if (collateralAmount_ > 0) {
            stargatePool.deposit(address(this), collateralAmount_);
        }
    }

    /// @dev Gets collateral balance deposited into Stargate pool. Collateral and LP are, usually, 1:1.
    function _getCollateralInStargate() internal view returns (uint256 _collateralStaked) {
        return lpAmountStaked() + stargateLp.balanceOf(address(this));
    }

    function _rebalance() internal override returns (uint256 _profit, uint256 _loss, uint256 _payback) {
        uint256 _excessDebt = IVesperPool(pool).excessDebt(address(this));
        uint256 _totalDebt = IVesperPool(pool).totalDebtOf(address(this));

        uint256 _collateralHere = collateralToken.balanceOf(address(this));

        uint256 _totalCollateral = _getCollateralInStargate() + _collateralHere;

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

        // strategy may get new fund. Deposit and stake it to stargate
        _deposit(collateralToken.balanceOf(address(this)));
        _stakeLp(stargateLp.balanceOf(address(this)));
    }

    function _stakeLp(uint256 lpAmount_) internal {
        if (lpAmount_ > 0) {
            stargateStaking.deposit(stargateLp, lpAmount_);
        }
    }

    function _unstakeLp(uint256 lpRequired_) internal {
        uint256 _lpHere = stargateLp.balanceOf(address(this));
        if (lpRequired_ > _lpHere) {
            uint256 lpToUnstake_ = lpRequired_ - _lpHere;
            uint256 _lpAmountStaked = lpAmountStaked();
            if (lpToUnstake_ > _lpAmountStaked) {
                lpToUnstake_ = _lpAmountStaked;
            }
            stargateStaking.withdraw(stargateLp, lpToUnstake_);
        }
    }

    /// @dev Withdraw collateral here. amount_ is collateral amount.
    /// @dev This method may withdraw less than requested amount. Caller may need to check balance before and after
    function _withdrawHere(uint256 amount_) internal override {
        // LP and collateral are 1:1
        _unstakeLp(amount_);

        // Minimum of amount_, available LP and available collateral in Stargate pool.
        amount_ = Math.min(amount_, Math.min(stargateLp.balanceOf(address(this)), stargatePool.poolBalance()));

        if (amount_ > 0) {
            stargatePool.redeem(amount_, address(this));
        }
    }
}
