// SPDX-License-Identifier: MIT
/* solhint-disable */
pragma solidity 0.8.9;

interface IMetaRegistry {
    function get_gauge(address pool) external view returns (address);

    function get_lp_token(address pool) external view returns (address);

    function get_n_coins(address pool) external view returns (uint256);

    function get_n_underlying_coins(address pool) external view returns (uint256);

    function get_underlying_coins(address pool) external view returns (address[8] memory);
}
