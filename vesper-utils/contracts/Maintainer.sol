// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {EnumerableSetUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import {Governable} from "./access/Governable.sol";

error AddressIsNull();
error NotAMaintainer();

/// @title Maintainer contract for Vesper ecosystem
contract Maintainer is Governable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    string public constant VERSION = "1.0.0";

    // solhint-disable-next-line var-name-mixedcase
    string public NAME;

    EnumerableSetUpgradeable.AddressSet internal _maintainers; // List of maintainer addresses

    modifier onlyMaintainer() {
        if (!isMaintainer(msg.sender)) revert NotAMaintainer();
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(string memory name_) external initializer {
        NAME = name_;
        __Governable_init();
    }

    function isMaintainer(address address_) public view returns (bool) {
        return governor == address_ || _maintainers.contains(address_);
    }

    function maintainers() external view returns (address[] memory) {
        return _maintainers.values();
    }

    /**
     * @notice onlyGovernor:: If given address is already a maintainer then remove maintainer else add as maintainer
     * @param maintainerAddress_ maintainer address to update.
     */
    function updateMaintainer(address maintainerAddress_) external onlyGovernor {
        if (maintainerAddress_ == address(0)) revert AddressIsNull();

        if (_maintainers.contains(maintainerAddress_)) {
            _maintainers.remove(maintainerAddress_);
        } else {
            _maintainers.add(maintainerAddress_);
        }
    }

    /**
     * @notice onlyMaintainer:: Execute encoded function provided as data_ at target_ address.
     * @param target_ Target address where function will be executed.
     * @param data_ Encoded function data to execute.
     */
    function execute(address target_, bytes calldata data_) external payable onlyMaintainer returns (bytes memory) {
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
