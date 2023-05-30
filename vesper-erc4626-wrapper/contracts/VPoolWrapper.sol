// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20Upgradeable as IERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {ERC4626Upgradeable as ERC4626} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import {SafeERC20Upgradeable as SafeERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {IVesperPool} from "vesper-pools/contracts/interfaces/vesper/IVesperPool.sol";
import {IPoolRewards} from "vesper-pools/contracts/interfaces/vesper/IPoolRewards.sol";
import {IPoolAccountant} from "vesper-pools/contracts/interfaces/vesper/IPoolAccountant.sol";

/// @title ERC4626 Wrapper for pools of Vesper Finance
contract VPoolWrapper is ERC4626 {
    using SafeERC20 for IERC20;

    uint256 internal constant MAX_BPS = 10000;

    IVesperPool public vToken;

    IPoolRewards public wrapperRewards;

    event UpdatedWrapperRewards(IPoolRewards indexed poolRewards, IPoolRewards indexed newPoolRewards);

    modifier onlyGovernor() {
        require(msg.sender == governor(), "not-governor");
        _;
    }

    constructor() {
        _disableInitializers();
    }

    function initialize(IVesperPool vToken_) external initializer {
        __ERC20_init(_vaultName(vToken_), _vaultSymbol(vToken_));
        __ERC4626_init(IERC20(address(vToken_.token())));

        IERC20(asset()).safeApprove(address(vToken_), type(uint256).max);
        vToken = vToken_;
    }

    function claimRewards(address account_) external {
        IPoolRewards _wrapperRewards = IPoolRewards(wrapperRewards);
        if (address(_wrapperRewards) != address(0)) {
            _wrapperRewards.claimReward(account_);
        }
    }

    function convertToAssets(uint256 shares_) public view virtual override returns (uint256) {
        return (shares_ * vToken.pricePerShare()) / 1e18;
    }

    function convertToShares(uint256 assets_) public view virtual override returns (uint256) {
        uint256 _pricePerShare = vToken.pricePerShare();
        uint256 _share = (assets_ * 1e18) / _pricePerShare;
        return assets_ > ((_share * _pricePerShare) / 1e18) ? _share + 1 : _share;
    }

    function dripToWrapperRewards() external {
        IPoolRewards _wrapperRewards = IPoolRewards(wrapperRewards);
        if (address(_wrapperRewards) == address(0)) {
            return;
        }

        IPoolRewards _poolRewards = IPoolRewards(vToken.poolRewards());
        if (address(_poolRewards) == address(0)) {
            return;
        }

        _poolRewards.claimReward(address(this));

        address[] memory _rewardTokens = _poolRewards.getRewardTokens();
        uint256 _length = _rewardTokens.length;
        for (uint256 i; i < _length; ++i) {
            address _token = _rewardTokens[i];
            require(_token != address(vToken), "vpool-as-reward-not-supported");

            uint256 _balance = IERC20(_token).balanceOf(address(this));

            if (_balance > 0) {
                if (!_wrapperRewards.isRewardToken(_token)) {
                    _wrapperRewards.addRewardToken(_token);
                }

                IERC20(_token).safeTransfer(address(_wrapperRewards), _balance);
                _wrapperRewards.notifyRewardAmount(_token, _balance, 15 days);
            }
        }
    }

    function governor() public view returns (address) {
        return vToken.governor();
    }

    function maxDeposit(address /*receiver_*/) public view override returns (uint256) {
        if (vToken.paused()) {
            return 0;
        }

        return type(uint256).max;
    }

    function maxMint(address /*receiver_*/) public view override returns (uint256) {
        if (vToken.paused()) {
            return 0;
        }

        return type(uint256).max - vToken.totalSupply();
    }

    function maxRedeem(address owner_) public view override returns (uint256) {
        if (vToken.stopEverything()) {
            return 0;
        }

        // Note: Actual withdraw-able may be less and it depends on available and/or locked fund in pool and strategies.
        return balanceOf(owner_);
    }

    function maxWithdraw(address owner_) public view override returns (uint256) {
        if (vToken.stopEverything()) {
            return 0;
        }

        // Note: Actual withdraw-able may be less and it depends on available and/or locked fund in pool and strategies.
        return convertToAssets(balanceOf(owner_));
    }

    function previewMint(uint256 shares_) public view virtual override returns (uint256) {
        uint256 _assetsAfterFee = convertToAssets(shares_);
        uint256 _fee = IPoolAccountant(vToken.poolAccountant()).externalDepositFee();
        return (_assetsAfterFee * MAX_BPS) / (MAX_BPS - _fee);
    }

    function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
        uint256 _fee = IPoolAccountant(vToken.poolAccountant()).externalDepositFee();
        uint256 _assetsToCollect = (assets * _fee) / MAX_BPS;
        return convertToShares(assets - _assetsToCollect);
    }

    function previewRedeem(uint256 shares) public view virtual override returns (uint256) {
        return convertToAssets(shares);
    }

    function previewWithdraw(uint256 assets_) public view virtual override returns (uint256) {
        return convertToShares(assets_);
    }

    function totalAssets() public view virtual override returns (uint256) {
        return (vToken.balanceOf(address(this)) * vToken.pricePerShare()) / 1e18;
    }

    function updateRewards(address account_) public {
        IPoolRewards _wrapperRewards = wrapperRewards;
        if (address(_wrapperRewards) != address(0)) {
            _wrapperRewards.updateReward(account_);
        }
    }

    function _afterDeposit(uint256 assets_) private {
        vToken.deposit(assets_);
    }

    function _beforeDeposit(address receiver_) private {
        updateRewards(receiver_);
    }

    function _beforeWithdraw(uint256 shares_, address owner_) private {
        updateRewards(owner_);
        uint256 _balanceBefore = vToken.balanceOf(address(this));
        vToken.withdraw(shares_);
        uint256 _burnt = _balanceBefore - vToken.balanceOf(address(this));
        require(_burnt == shares_, "partially-withdraw-not-supported");
    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        _beforeDeposit(receiver);
        super._deposit(caller, receiver, assets, shares);
        _afterDeposit(assets);
    }

    function _vaultName(IVesperPool vToken_) internal view virtual returns (string memory) {
        return string(abi.encodePacked("ERC4626-Wrapped Vesper ", vToken_.symbol()));
    }

    function _vaultSymbol(IVesperPool vToken_) internal view virtual returns (string memory) {
        return string(abi.encodePacked("w", vToken_.symbol()));
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override {
        _beforeWithdraw(shares, owner);
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    function updateWrapperRewards(IPoolRewards newWrapperRewards_) external onlyGovernor {
        require(address(newWrapperRewards_) != address(0), "address-is-zero");
        emit UpdatedWrapperRewards(wrapperRewards, newWrapperRewards_);
        wrapperRewards = newWrapperRewards_;
    }
}
