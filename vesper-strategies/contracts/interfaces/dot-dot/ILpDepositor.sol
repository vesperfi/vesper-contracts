// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface ILpDepositor {
    /**
        @notice Claim pending EPX and DDD rewards
        @param _receiver Account to send claimed rewards to
        @param _tokens List of LP tokens to claim for
        @param _maxBondAmount Maximum amount of claimed EPX to convert to bonded dEPX.
                              Converting to bonded dEPX earns a multiplier on DDD rewards.
     */
    function claim(
        address _receiver,
        address[] calldata _tokens,
        uint256 _maxBondAmount
    ) external;

    struct Amounts {
        uint256 epx;
        uint256 ddd;
    }

    /// @dev _tokens is Ellipsis LP Token array
    function claimable(address _user, address[] calldata _tokens) external view returns (Amounts[] memory);

    /// @dev _token is Ellipsis LP Token
    function deposit(
        address _user,
        address _token,
        uint256 _amount
    ) external;

    /// @dev _token is Ellipsis LP Token
    function extraRewards(address _token, uint256 _index) external view returns (address);

    /// @dev _pool is Ellipsis LP Token
    function extraRewardsLength(address _pool) external view returns (uint256);

    /// @dev _token is Ellipsis LP Token
    function userBalances(address _user, address _token) external view returns (uint256);

    /// @dev _token is Ellipsis LP Token
    function withdraw(
        address _receiver,
        address _token,
        uint256 _amount
    ) external;
}
