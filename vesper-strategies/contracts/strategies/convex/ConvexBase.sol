// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;
import "vesper-pools/contracts/dependencies/openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../interfaces/convex/IConvex.sol";
import "../../interfaces/convex/IConvexToken.sol";

// Convex Strategies common variables and helper functions
abstract contract ConvexBase {
    using SafeERC20 for IERC20;

    address public constant CVX = 0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B;
    address private constant CRV = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    IConvex public constant BOOSTER = IConvex(0xF403C135812408BFbE8713b5A23a04b3D48AAE31);

    Rewards public immutable cvxCrvRewards;
    uint256 public immutable convexPoolId;

    bool public isClaimRewards;

    struct ClaimableRewardInfo {
        address token;
        uint256 amount;
    }

    constructor(uint256 convexPoolId_) {
        (, , , address _reward, , ) = BOOSTER.poolInfo(convexPoolId_);
        cvxCrvRewards = Rewards(_reward);
        convexPoolId = convexPoolId_;
    }

    // TODO: review this again.  There may be substitute
    // See https://docs.convexfinance.com/convexfinanceintegration/cvx-minting
    function _calculateCVXRewards(uint256 _claimableCrvRewards) internal view returns (uint256 _total) {
        // CVX Rewards are minted based on CRV rewards claimed upon withdraw
        // This will calculate the CVX amount based on CRV rewards accrued
        // without having to claim CRV rewards first
        // ref 1: https://github.com/convex-eth/platform/blob/main/contracts/contracts/Cvx.sol#L61-L76
        // ref 2: https://github.com/convex-eth/platform/blob/main/contracts/contracts/Booster.sol#L458-L466

        uint256 _reductionPerCliff = IConvexToken(CVX).reductionPerCliff();
        uint256 _totalSupply = IConvexToken(CVX).totalSupply();
        uint256 _maxSupply = IConvexToken(CVX).maxSupply();
        uint256 _cliff = _totalSupply / _reductionPerCliff;
        uint256 _totalCliffs = 1000;

        if (_cliff < _totalCliffs) {
            //for reduction% take inverse of current cliff
            uint256 _reduction = _totalCliffs - _cliff;
            //reduce
            _total = (_claimableCrvRewards * _reduction) / _totalCliffs;

            //supply cap check
            uint256 _amtTillMax = _maxSupply - _totalSupply;
            if (_total > _amtTillMax) {
                _total = _amtTillMax;
            }
        }
    }

    // TODO: Try to optimize more
    function _getRewardTokens() internal view returns (address[] memory _rewardTokens) {
        uint256 _extraRewardCount;
        uint256 _length = cvxCrvRewards.extraRewardsLength();

        for (uint256 i; i < _length; ++i) {
            address _rewardToken = Rewards(cvxCrvRewards.extraRewards(i)).rewardToken();
            // Some pool has CVX as extra rewards but other do not. CVX still reward token
            if (_rewardToken != CRV && _rewardToken != CVX) {
                _extraRewardCount++;
            }
        }

        _rewardTokens = new address[](_extraRewardCount + 2);
        _rewardTokens[0] = CRV;
        _rewardTokens[1] = CVX;

        uint256 _index = 2;

        for (uint256 i; i < _length; ++i) {
            address _rewardToken = Rewards(cvxCrvRewards.extraRewards(i)).rewardToken();
            // CRV and CVX already added in array
            if (_rewardToken != CRV && _rewardToken != CVX) {
                _rewardTokens[_index++] = _rewardToken;
            }
        }
    }
}
