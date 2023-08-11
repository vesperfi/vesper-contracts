// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {EnumerableSetUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import {Governable} from "./access/Governable.sol";

error AddressIsNull();
error NotAKeeper();

/// @title Keeper contract for Vesper ecosystem
contract Keeper is Governable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    string public constant VERSION = "1.0.0";

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;

    EnumerableSetUpgradeable.AddressSet internal _keepers; // List of keeper addresses

    modifier onlyKeeper() {
        if (!isKeeper(msg.sender)) revert NotAKeeper();
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name_) external initializer {
        NAME = name_;
        __Governable_init();
    }

    function isKeeper(address address_) public view returns (bool) {
        return governor == address_ || _keepers.contains(address_);
    }

    function keepers() external view returns (address[] memory) {
        return _keepers.values();
    }

    /**
     * @notice onlyGovernor:: If given address is already a keeper then remove keeper else add as keeper
     * @param keeperAddress_ keeper address to update.
     */
    function updateKeeper(address keeperAddress_) external onlyGovernor {
        if (keeperAddress_ == address(0)) revert AddressIsNull();

        if (_keepers.contains(keeperAddress_)) {
            _keepers.remove(keeperAddress_);
        } else {
            _keepers.add(keeperAddress_);
        }
    }

    /**
     * @notice onlyKeeper:: Execute encoded function provided as data_ at target_ address.
     * @param target_ Target address where function will be executed.
     * @param data_ Encoded function data to execute.
     */
    function execute(address target_, bytes calldata data_) external payable onlyKeeper returns (bytes memory) {
        // solhint-disable-next-line avoid-low-level-calls
        (bool _success, bytes memory _returnData) = target_.call{value: msg.value}(data_);
        if (_success) {
            return _returnData;
        } else {
            // Below code is taken from https://ethereum.stackexchange.com/a/114140
            // solhint-disable-next-line no-inline-assembly
            assembly {
                revert(add(_returnData, 32), _returnData)
            }
        }
    }
}
