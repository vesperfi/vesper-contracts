// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/token/IToken.sol";
import "./CompoundLike.sol";

contract BenqiAVAX is CompoundLike {
    //solhint-disable no-empty-blocks
    constructor(
        address _pool,
        address _swapManager,
        address _comptroller,
        address _rewardDistributor,
        address _rewardToken,
        address _receiptToken,
        string memory _name
    ) CompoundLike(_pool, _swapManager, _comptroller, _rewardDistributor, _rewardToken, _receiptToken, _name) {}

    /**
     * @dev This hook get called after collateral is redeemed from Benqi
     * Vesper deals in WAVAX as collateral so convert AVAX to WAVAX
     */
    function _afterRedeem() internal override {
        TokenLike(WAVAX).deposit{value: address(this).balance}();
    }

    /**
     * @dev During deposit we have WAVAX as collateral but Compound accepts AVAX.
     * Withdraw AVAX from WAVAX before calling mint in Compound.
     */
    function _deposit(uint256 _amount) internal override {
        if (_amount > 0) {
            TokenLike(WAVAX).withdraw(_amount);
            cToken.mint{value: _amount}();
        }
    }
}
