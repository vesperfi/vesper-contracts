// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./Curve.sol";
import "vesper-pools/contracts/interfaces/token/IToken.sol";

/// @title Deposit ETH to Curve Pool and earn interest.
contract CurveETH is Curve {
    using SafeERC20 for IERC20;

    // solhint-disable-next-line var-name-mixedcase
    TokenLike public immutable WETH;

    constructor(
        address pool_,
        address crvPool_,
        CurveBase.PoolType curvePoolType_,
        address depositZap_,
        address crvToken_,
        uint256 crvSlippage_,
        address masterOracle_,
        address swapper_,
        uint256 collateralIdx_,
        string memory name_,
        TokenLike wethLike_
    )
        Curve(
            pool_,
            crvPool_,
            curvePoolType_,
            depositZap_,
            crvToken_,
            crvSlippage_,
            masterOracle_,
            swapper_,
            collateralIdx_,
            name_
        )
    {
        WETH = wethLike_;
    }

    /**
     * @dev During reinvest we have WETH as collateral but Curve accepts ETH.
     * Withdraw ETH from WETH before adding liquidity to Curve pool.
     */
    function _depositToCurve(uint256 coinAmountIn_) internal override {
        if (coinAmountIn_ == 0) {
            return;
        }

        WETH.withdraw(coinAmountIn_);

        super._depositToCurve(coinAmountIn_, true);
    }

    function _verifyCollateral(address collateralFromCurve_) internal view override {
        require(collateralFromCurve_ == address(collateralToken) || collateralFromCurve_ == ETH, "collateral-mismatch");
    }

    /**
     *  @dev Only receive ETH from either pool or WETH
     */
    receive() external payable {
        require(msg.sender == address(crvPool) || msg.sender == address(WETH), "not-allowed-to-send-ether");
        if (msg.sender == address(crvPool)) {
            WETH.deposit{value: address(this).balance}();
        }
    }
}
