// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

interface ILendingPool {
    // Interest Rate Config
    // The utilization rate and borrowing rate are expressed in RAY
    // utilizationB must gt utilizationA
    struct InterestRateConfig {
        // The utilization rate a, the end of the first slope on interest rate curve
        uint128 utilizationA;
        // The borrowing rate at utilization_rate_a
        uint128 borrowingRateA;
        // The utilization rate a, the end of the first slope on interest rate curve
        uint128 utilizationB;
        // The borrowing rate at utilization_rate_b
        uint128 borrowingRateB;
        // the max borrowing rate while the utilization is 100%
        uint128 maxBorrowingRate;
    }

    struct ReserveData {
        // variable borrow index.
        uint256 borrowingIndex;
        // the current borrow rate.
        uint256 currentBorrowingRate;
        // the total borrows of the reserve at a variable rate. Expressed in the currency decimals
        uint256 totalBorrows;
        // underlying token address
        address underlyingTokenAddress;
        // eToken address
        address eTokenAddress;
        // staking address
        address stakingAddress;
        // the capacity of the reserve pool
        uint256 reserveCapacity;
        // borrowing rate config
        InterestRateConfig borrowingRateConfig;
        // the id of the reserve. Represents the position in the list of the reserves
        uint256 id;
        uint128 lastUpdateTimestamp;
        // reserve fee charged, percent of the borrowing interest that is put into the treasury.
        uint16 reserveFeeRate;
        Flags flags;
    }

    struct Flags {
        bool isActive; // set to 1 if the reserve is properly configured
        bool frozen; // set to 1 if reserve is frozen, only allows repays and withdraws, but not deposits or new borrowings
        bool borrowingEnabled; // set to 1 if borrowing is enabled, allow borrowing from this pool
    }

    function reserves(uint256) external view returns (ReserveData memory);

    function utilizationRateOfReserve(uint256 reserveId) external view returns (uint256);

    function borrowingRateOfReserve(uint256 reserveId) external view returns (uint256);

    function exchangeRateOfReserve(uint256 reserveId) external view returns (uint256);

    function totalLiquidityOfReserve(uint256 reserveId) external view returns (uint256 totalLiquidity);

    function totalBorrowsOfReserve(uint256 reserveId) external view returns (uint256 totalBorrows);

    function getReserveIdOfDebt(uint256 debtId) external view returns (uint256);

    struct ReserveStatus {
        uint256 reserveId;
        address underlyingTokenAddress;
        address eTokenAddress;
        address stakingAddress;
        uint256 totalLiquidity;
        uint256 totalBorrows;
        uint256 exchangeRate;
        uint256 borrowingRate;
    }

    struct PositionStatus {
        uint256 reserveId;
        address user;
        uint256 eTokenStaked;
        uint256 eTokenUnStaked;
        uint256 liquidity;
    }

    /**
     * @dev Deposits an `amount` of underlying asset into the reserve, receiving in return overlying eTokens.
     * - E.g. User deposits 100 USDC and gets in return for specific amount of eUSDC
     * the eUSDC amount depends on the exchange rate between USDC and eUSDC
     * @param reserveId The ID of the reserve
     * @param amount The amount of reserve to be deposited
     * @param onBehalfOf The address that will receive the eTokens, same as msg.sender if the user
     *   wants to receive them on his own wallet, or a different address if the beneficiary of eTokens
     *   is a different wallet
     * @param referralCode Code used to register the integrator originating the operation, for potential rewards.
     *   0 if the action is executed directly by the user, without any middle-man
     **/
    function deposit(
        uint256 reserveId,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external payable returns (uint256 eTokenAmount);

    function depositAndStake(
        uint256 reserveId,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external payable returns (uint256 eTokenAmount);

    function redeem(
        uint256 reserveId,
        uint256 eTokenAmount,
        address to,
        bool receiveNativeETH
    ) external payable returns (uint256 underlyingTokenAmount);

    function unStakeAndWithdraw(
        uint256 reserveId,
        uint256 eTokenAmount,
        address to,
        bool receiveNativeETH
    ) external payable returns (uint256 underlyingTokenAmount);

    function newDebtPosition(uint256 reserveId) external returns (uint256);

    function getCurrentDebt(uint256 debtId) external view returns (uint256 currentDebt, uint256 latestBorrowingIndex);

    /**
     * @dev Allows farming users to borrow a specific `amount` of the reserve underlying asset.
     * The user's borrowed tokens is transferred to the vault position contract and is recorded in the user's vault position(VaultPositionManageContract).
     * When debt ratio of user's vault position reach the liquidate limit,
     * the position will be liquidated and repay his debt(borrowed value + accrued interest)
     * @param onBehalfOf The beneficiary of the borrowing, receiving the tokens in his vaultPosition
     * @param debtId The debtPositionId
     * @param amount The amount to be borrowed
     */
    function borrow(address onBehalfOf, uint256 debtId, uint256 amount) external;

    /**
     * @notice Repays borrowed underlying tokens to the reserve pool
     * The user's debt is recorded in the vault position(VaultPositionManageContract).
     * After this function successfully executed, user's debt should be reduced in VaultPositionManageContract.
     * @param onBehalfOf The user who repay debts in his vaultPosition
     * @param debtId The debtPositionId
     * @param amount The amount to be borrowed
     * @return The final amount repaid
     **/
    function repay(address onBehalfOf, uint256 debtId, uint256 amount) external returns (uint256);

    function getUnderlyingTokenAddress(uint256 reserveId) external view returns (address underlyingTokenAddress);

    function getETokenAddress(uint256 reserveId) external view returns (address underlyingTokenAddress);

    function getStakingAddress(uint256 reserveId) external view returns (address);
}
