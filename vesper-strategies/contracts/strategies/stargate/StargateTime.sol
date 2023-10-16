// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "./Stargate.sol";

/// @dev This version of stargate can be deployed on any chain which has time
/// based block generation e.g. Optimism
contract StargateTime is Stargate {
    constructor(
        address pool_,
        address swapper_,
        IStargateRouter stargateRouter_,
        IStargatePool stargateLp_,
        IStargateLpStaking stargateLpStaking_,
        uint256 stargatePoolId_,
        uint256 stargateLpStakingPoolId_,
        string memory name_
    )
        Stargate(
            pool_,
            swapper_,
            stargateRouter_,
            stargateLp_,
            stargateLpStaking_,
            stargatePoolId_,
            stargateLpStakingPoolId_,
            name_
        )
    {}

    function pendingRewards() external view override returns (uint256) {
        return
            IStargateLpStakingTime(address(stargateLpStaking)).pendingEmissionToken(
                stargateLpStakingPoolId,
                address(this)
            );
    }

    function _getRewardToken(IStargateLpStaking stargateLpStaking_) internal view override returns (address) {
        return IStargateLpStakingTime(address(stargateLpStaking_)).eToken();
    }
}
