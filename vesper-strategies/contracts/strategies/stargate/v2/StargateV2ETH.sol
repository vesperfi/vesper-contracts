// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import {SafeERC20} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {TokenLike} from "vesper-pools/contracts/interfaces/token/IToken.sol";
import {IStargatePoolV2 as IStargatePool} from "../../../interfaces/stargate/v2/IStargatePoolV2.sol";
import {IStargateStaking} from "../../../interfaces/stargate/v2/IStargateStaking.sol";
import {StargateV2} from "./StargateV2.sol";

/// @title This Strategy will deposit ETH in a Stargate V2 Pool
/// Stake LP Token and accrue swap rewards
contract StargateV2ETH is StargateV2 {
    using SafeERC20 for TokenLike;

    TokenLike public immutable wrappedNativeToken;

    /// @dev The rate between local decimals and shared decimals.
    uint256 internal immutable convertRate;

    constructor(
        address pool_,
        address swapper_,
        IStargatePool stargatePool_,
        IStargateStaking stargateStaking_,
        TokenLike wrappedNativeToken_,
        string memory name_
    ) StargateV2(pool_, swapper_, stargatePool_, stargateStaking_, name_) {
        require(address(wrappedNativeToken_) != address(0), "wrapped-eth-is-null");

        wrappedNativeToken = wrappedNativeToken_;

        uint8 _sharedDecimals = stargatePool.sharedDecimals();
        uint8 _localDecimals = IERC20Metadata(address(stargateLp)).decimals();
        require(_localDecimals > _sharedDecimals, "invalid-stargate-decimals");

        convertRate = 10 ** (_localDecimals - _sharedDecimals);
    }

    receive() external payable {
        /// @dev Stargate will send ETH when we withdraw from Stargate ETH pool.
        /// So convert ETH to WETH if ETH sender is not WETH contract.
        if (msg.sender != address(wrappedNativeToken)) {
            wrappedNativeToken.deposit{value: address(this).balance}();
        }
    }

    /**
     * @dev Stargate has concept of sharedDecimals and localDecimals.
     * The amount we supply is in localDecimals and stargate convert it into sharedDecimals and back.
     * By doing this stargate removes dust from input amount.
     * In case of native pool, stargate expects users to provide proper input and has an assert to enforce this.
     * @param amountLD_ amount in local decimals
     */
    function _deDustAmount(uint256 amountLD_) internal view returns (uint256) {
        // uint256 _amountSD = amountLD_ / convertRate;
        // uint256 _amountLD = _amountSD * convertRate;
        return (amountLD_ / convertRate) * convertRate;
    }

    /**
     * @dev Stargate ETH strategy supports ETH as collateral and Vesper deals
     * in WETH. Hence withdraw ETH from WETH before depositing in Stargate pool
     */
    function _deposit(uint256 collateralAmount_) internal override {
        collateralAmount_ = _deDustAmount(collateralAmount_);
        if (collateralAmount_ > 0) {
            wrappedNativeToken.withdraw(collateralAmount_);
            stargatePool.deposit{value: collateralAmount_}(address(this), collateralAmount_);
        }
    }
}
