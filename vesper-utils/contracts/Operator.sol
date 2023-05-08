// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";
import "./access/Governable.sol";

error AddressIsNull();
error NotAnOperator();

/// @title Operator contract for Vesper ecosystem
contract Operator is Governable {
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;

    string public NAME;

    EnumerableSetUpgradeable.AddressSet internal _operators; // List of operator addresses

    modifier onlyOperator() {
        if (!isOperator(msg.sender)) revert NotAnOperator();
        _;
    }

    constructor(string memory name_) {
        NAME = name_;
        _disableInitializers();
    }

    function initialize(string memory name_) external initializer {
        NAME = name_;
        __Governable_init();
    }

    function isOperator(address address_) public view returns (bool) {
        return governor == address_ || _operators.contains(address_);
    }

    function operators() external view returns (address[] memory) {
        return _operators.values();
    }

    /**
     * @notice onlyGovernor:: If given address is already a operator then remove operator else add as operator
     * @param operatorAddress_ operator address to update.
     */
    function updateOperator(address operatorAddress_) external onlyGovernor {
        if (operatorAddress_ == address(0)) revert AddressIsNull();

        if (_operators.contains(operatorAddress_)) {
            _operators.remove(operatorAddress_);
        } else {
            _operators.add(operatorAddress_);
        }
    }

    /**
     * @notice onlyOperator:: Execute encoded function provided as data_ at target_ address.
     * @param target_ Target address where function will be executed.
     * @param data_ Encoded function data to execute.
     */
    function execute(address target_, bytes calldata data_) external payable onlyOperator returns (bytes memory) {
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
