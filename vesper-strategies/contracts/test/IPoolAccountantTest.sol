// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "vesper-pools/contracts/interfaces/vesper/IPoolAccountant.sol";

interface IPoolAccountantTest is IPoolAccountant {
    event EarningReported(
        address indexed strategy,
        uint256 profit,
        uint256 loss,
        uint256 payback,
        uint256 strategyDebt,
        uint256 poolDebt,
        uint256 creditLine
    );

    function addStrategy(
        address _strategy,
        uint256 _debtRatio,
        uint256 _externalDepositFee
    ) external;

    function updateDebtRatio(address _strategy, uint256 _debtRatio) external;
}
