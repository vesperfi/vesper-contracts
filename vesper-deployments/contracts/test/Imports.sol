// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

// Import all contracts which are being used in any deployment script from `vesper-pools` and `vesper-strategies` modules.
// This will ensure contracts are compiled and copied in artifacts folder.
import "vesper-pools/contracts/pool/PoolRewards.sol";
import "vesper-pools/contracts/pool/PoolAccountant.sol";
import "vesper-pools/contracts/pool/VPool.sol";
import "vesper-pools/contracts/pool/VETH.sol";
import "vesper-pools/contracts/pool/earn/VesperEarnDrip.sol";
import "vesper-pools/contracts/upgraders/PoolAccountantUpgrader.sol";
import "vesper-pools/contracts/upgraders/PoolRewardsUpgrader.sol";
import "vesper-pools/contracts/upgraders/VPoolUpgrader.sol";
import "vesper-strategies/contracts/strategies/compound/CompoundXy.sol";
import "vesper-strategies/contracts/strategies/aave/v2/AaveV2VesperXy.sol";
import "vesper-strategies/contracts/strategies/compound/CompoundXyETH.sol";
import "vesper-strategies/contracts/strategies/compound/CompoundVesperXyETH.sol";
import "vesper-strategies/contracts/strategies/aave/v2/AaveV2VesperXy.sol";
import "vesper-strategies/contracts/strategies/convex/Convex.sol";
import "vesper-strategies/contracts/strategies/vesper/earn/VesperEarnSaddleLp.sol";
import "vesper-strategies/contracts/strategies/aave/v2/AaveV2.sol";
import "vesper-strategies/contracts/strategies/compound/CompoundLeverage.sol";
import "vesper-strategies/contracts/strategies/stargate/Stargate.sol";
import "vesper-strategies/contracts/strategies/maker/MakerVesperStETH.sol";
import "vesper-strategies/contracts/interfaces/maker/IMakerDAO.sol";
import "vesper-strategies/contracts/strategies/convex/Convex.sol";
import "vesper-strategies/contracts/strategies/convex/ConvexForFrax.sol";
import "vesper-strategies/contracts/strategies/curve/Curve.sol";
import "vesper-strategies/contracts/strategies/compound/bsc/VenusBNB.sol";
import "vesper-strategies/contracts/strategies/euler/Euler.sol";
import "vesper-strategies/contracts/strategies/euler/EulerVesperXy.sol";
import "vesper-strategies/contracts/strategies/compound/CompoundVesperXy.sol";
import "vesper-strategies/contracts/strategies/compound/avalanche/BenqiAVAX.sol";
import "vesper-strategies/contracts/strategies/stargate/StargateETH.sol";
import "vesper-strategies/contracts/strategies/aave/v3/AaveV3VesperXy.sol";
import "vesper-strategies/contracts/strategies/convex/ConvexForFrax.sol";
import "vesper-strategies/contracts/strategies/compound/v3/CompoundV3VesperXy.sol";
import "vesper-strategies/contracts/strategies/curve/CurveETH.sol";
import "vesper-strategies/contracts/strategies/compound/optimism/Sonne.sol";
import "vesper-strategies/contracts/strategies/compound/optimism/SonneLeverage.sol";
import "vesper-strategies/contracts/strategies/compound/optimism/SonneVesperXy.sol";
import "vesper-strategies/contracts/strategies/frax-lend/FraxLend.sol";
import "vesper-strategies/contracts/strategies/frax-lend/FraxLendVesperXy.sol";
import "vesper-strategies/contracts/strategies/yearn/YearnStaking.sol";

// Importer contract to compile the solidity files from dependent `vesper-pools` and `vesper-strategies` modules.
// solhint-disable-next-line no-empty-blocks
contract Imports {

}
