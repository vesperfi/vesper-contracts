// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "./CompoundLeverage.sol";

// solhint-disable no-empty-blocks
/// @title Deposit ETH in Compound and earn interest.
contract CompoundLeverageETH is CompoundLeverage {
    address private constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    constructor(
        address _pool,
        address _swapManager,
        address _comptroller,
        address _rewardDistributor,
        address _rewardToken,
        address _aaveAddressesProvider,
        address _receiptToken,
        string memory _name
    )
        CompoundLeverage(
            _pool,
            _swapManager,
            _comptroller,
            _rewardDistributor,
            _rewardToken,
            _aaveAddressesProvider,
            _receiptToken,
            _name
        )
    {}

    /// @dev Only receive ETH from either cToken or WETH
    receive() external payable {
        require(msg.sender == address(cToken) || msg.sender == WETH, "not-allowed-to-send-ether");
    }

    /// @dev On borrow we will receive ETH. Convert received ETH into WETH
    function _borrowCollateral(uint256 _amount) internal override {
        super._borrowCollateral(_amount);
        _depositETH();
    }

    /// @dev Compound support ETH as collateral. Convert WETH to ETH and mint cETH
    function _mint(uint256 _amount) internal override {
        _withdrawETH(_amount);
        cToken.mint{value: _amount}();
    }

    /// @dev On redeem we will receive ETH. Convert received ETH into WETH
    function _redeemUnderlying(uint256 _amount) internal override {
        super._redeemUnderlying(_amount);
        _depositETH();
    }

    /// @dev Repay will take ETH. Convert WETH to ETH and call payable repay function
    function _repayBorrow(uint256 _amount) internal override {
        _withdrawETH(_amount);
        cToken.repayBorrow{value: _amount}();
    }

    /// @dev Deposit ETH and get WETH in return
    function _depositETH() internal {
        TokenLike(WETH).deposit{value: address(this).balance}();
    }

    /// @dev Withdraw ETH by burning similar amount of WETH
    function _withdrawETH(uint256 _amount) internal {
        TokenLike(WETH).withdraw(_amount);
    }
}
