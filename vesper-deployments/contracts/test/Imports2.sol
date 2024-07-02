// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

// Import all contracts which are being used in any deployment script from `vesper-pools` and `vesper-strategies` modules.
// This will ensure contracts are compiled and copied in artifacts folder.

// This has conflict with other imports in Imports.sol hence created new file. Easy solution but not the clean.
import "vesper-strategies/contracts/strategies/extra-finance/ExtraFinance.sol";
import "vesper-strategies/contracts/strategies/stargate/v2/StargateV2.sol";
import "vesper-strategies/contracts/strategies/stargate/v2/StargateV2ETH.sol";

// Importer contract to compile the solidity files from dependent `vesper-pools` and `vesper-strategies` modules.
// solhint-disable-next-line no-empty-blocks
contract Imports2 {

}
