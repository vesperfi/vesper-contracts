// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "../CompoundXyCore.sol";
import "../../../interfaces/compound/ICompound.sol";

/// @title This strategy will deposit collateral token in Venus and based on position it will borrow
/// another token. Supply X borrow Y and keep borrowed amount here. It does handle rewards and handle
/// wrap/unwrap of WBNB as BNB is required to interact with Venus.
contract VenusXy is CompoundXyCore {
    using SafeERC20 for IERC20;

    address public immutable rewardToken;
    TokenLike internal constant WBNB = TokenLike(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c);
    address private constant VBNB = 0xA07c5b74C9B40447a954e1466938b865b6BBea36;

    constructor(
        address pool_,
        address swapper_,
        address comptroller_,
        address rewardToken_,
        address receiptToken_,
        address borrowCToken_,
        string memory name_
    ) CompoundXyCore(pool_, swapper_, comptroller_, receiptToken_, borrowCToken_, name_) {
        require(rewardToken_ != address(0), "rewardToken-address-is-null");
        rewardToken = rewardToken_;
    }

    //solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function _approveToken(uint256 _amount) internal virtual override {
        super._approveToken(_amount);
        IERC20(rewardToken).safeApprove(address(swapper), _amount);
    }

    /// @dev If borrowToken WBNB then wrap borrowed BNB to get WBNB
    function _borrowY(uint256 amount_) internal override {
        if (amount_ > 0) {
            require(borrowCToken.borrow(amount_) == 0, "borrow-from-venus-failed");
            if (borrowToken == address(WBNB)) {
                WBNB.deposit{value: address(this).balance}();
            }
            _afterBorrowY(amount_);
        }
    }

    /// @notice Claim rewardToken and convert rewardToken into collateral token.
    function _claimRewardsAndConvertTo(address toToken_) internal virtual override {
        address[] memory _markets = new address[](2);
        _markets[0] = address(supplyCToken);
        _markets[1] = address(borrowCToken);
        VenusComptroller(address(comptroller)).claimVenus(address(this), _markets);
        uint256 _rewardAmount = IERC20(rewardToken).balanceOf(address(this));
        if (_rewardAmount > 0) {
            _safeSwapExactInput(rewardToken, toToken_, _rewardAmount);
        }
    }

    /// @dev vBNB doesn't has underlying method
    function _getUnderlyingToken(address cToken_) internal view virtual override returns (address) {
        if (cToken_ == VBNB) {
            return address(WBNB);
        }
        return CToken(cToken_).underlying();
    }

    /// @dev If borrowToken is WBNB then unwrap WBNB to get BNB and repay borrow using BNB.
    function _repayY(uint256 amount_) internal override {
        _beforeRepayY(amount_);
        if (borrowToken == address(WBNB)) {
            WBNB.withdraw(amount_);
            borrowCToken.repayBorrow{value: amount_}();
        } else {
            require(borrowCToken.repayBorrow(amount_) == 0, "repay-to-venus-failed");
        }
    }
}
