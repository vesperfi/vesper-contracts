// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../interfaces/dot-dot/ILpDepositor.sol";
import "../ellipsis/Ellipsis.sol";

/// @title This strategy will deposit collateral token in a Ellipsis Pool and stake
/// Ellipsis LP tokens in DotDot protocol to earn yield
contract DotDot is Ellipsis {
    using SafeERC20 for IEllipsisLp;

    address public constant DDD = 0x84c97300a190676a19D1E13115629A11f8482Bd1;
    ILpDepositor public constant LP_DEPOSITOR = ILpDepositor(0x8189F0afdBf8fE6a9e13c69bA35528ac6abeB1af);

    struct ClaimableRewardInfo {
        address token;
        uint256 amount;
    }

    constructor(
        address pool_,
        address ellipsisPool_,
        PoolType ellipsisPoolType_,
        address depositZap_,
        uint256 ellipsisSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_
    )
        Ellipsis(
            pool_,
            ellipsisPool_,
            ellipsisPoolType_,
            depositZap_,
            ellipsisSlippage_,
            masterOracle_,
            swapper_,
            collateralIdx_,
            name_
        )
    {
        rewardTokens = _getRewardTokens();
    }

    function lpBalanceStaked() public view override returns (uint256 _lpStaked) {
        _lpStaked = LP_DEPOSITOR.userBalances(address(this), address(ellipsisLp));
    }

    function _approveToken(uint256 amount_) internal virtual override {
        super._approveToken(amount_);
        ellipsisLp.safeApprove(address(LP_DEPOSITOR), amount_);
    }

    /// @dev Return values are not being used hence returning 0
    function _claimRewards() internal override returns (address, uint256) {
        address[] memory _tokens = new address[](1);
        _tokens[0] = address(ellipsisLp);
        LP_DEPOSITOR.claim(address(this), _tokens, 0);
        return (address(0), 0);
    }

    /**
     * @dev Prepare rewardToken array
     * @return _rewardTokens The array of reward tokens (both base and extra rewards)
     */
    function _getRewardTokens() private view returns (address[] memory _rewardTokens) {
        uint256 _length = LP_DEPOSITOR.extraRewardsLength(address(ellipsisLp));

        _rewardTokens = new address[](_length + 2);
        _rewardTokens[0] = EPX;
        _rewardTokens[1] = DDD;
        uint256 _nextIdx = 2;

        for (uint256 i; i < _length; i++) {
            _rewardTokens[_nextIdx++] = LP_DEPOSITOR.extraRewards(address(ellipsisLp), i);
        }
    }

    function _stakeAllLp() internal virtual override {
        uint256 _balance = ellipsisLp.balanceOf(address(this));
        if (_balance > 0) {
            LP_DEPOSITOR.deposit(address(this), address(ellipsisLp), _balance);
        }
    }

    function _unstakeLp(uint256 _amount) internal override {
        if (_amount > 0) {
            LP_DEPOSITOR.withdraw(address(this), address(ellipsisLp), _amount);
        }
    }

    /************************************************************************************************
     *                          Governor/admin/keeper function                                      *
     ***********************************************************************************************/

    /**
     * @notice DotDot can add new rewards. This method refresh list.
     * It is recommended to claimAndSwapRewards before calling this function.
     */
    function setRewardTokens(address[] memory /*_rewardTokens*/) external override onlyKeeper {
        // Before updating the reward list, claim rewards and swap into collateral.
        // Passing 0 as minOut in case there is no rewards when this function is called.
        _claimAndSwapRewards(0);
        rewardTokens = _getRewardTokens();
        _approveToken(0);
        _approveToken(MAX_UINT_VALUE);
    }
}
