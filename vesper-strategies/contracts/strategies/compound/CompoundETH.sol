// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./Compound.sol";
import "vesper-pools/contracts/interfaces/token/IToken.sol";

// solhint-disable no-empty-blocks
/// @title Deposit ETH/WETH in Compound and earn interest.
contract CompoundETH is Compound {
    // solhint-disable-next-line  var-name-mixedcase
    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    constructor(
        address _pool,
        address _swapper,
        address _comptroller,
        address _rewardToken,
        address _receiptToken,
        string memory _name
    ) Compound(_pool, _swapper, _comptroller, _rewardToken, _receiptToken, _name) {}

    /// @dev Only receive ETH from either cToken or WETH
    receive() external payable {
        require(msg.sender == address(cToken) || msg.sender == WETH, "not-allowed-to-send-ether");
    }

    /**
     * @dev This hook get called after collateral is redeemed from Compound
     * Vesper deals in WETH as collateral so convert ETH to WETH
     */
    function _afterRedeem() internal override {
        TokenLike(WETH).deposit{value: address(this).balance}();
    }

    /**
     * @dev During reinvest we have WETH as collateral but Compound accepts ETH.
     * Withdraw ETH from WETH before calling mint in Compound.
     */
    function _deposit(uint256 _amount) internal override {
        if (_amount > 0) {
            TokenLike(WETH).withdraw(_amount);
            cToken.mint{value: _amount}();
        }
    }
}
