// SPDX-License-Identifier: MIT
/* solhint-disable */
pragma solidity 0.8.9;

interface ILiquidityGaugeFactory {
    function is_valid_gauge(address _gauge) external view returns (bool);

    function mint(address gauge_addr) external;
}
/* solhint-enable */
