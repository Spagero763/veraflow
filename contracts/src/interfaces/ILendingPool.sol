// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ILendingPool
/// @notice Interface for the VeraFlow reputation-backed micro-lending pool
/// @dev Built on ERC-4626 vault standard. Lenders deposit stablecoins,
///      workers borrow against their on-chain reputation score.
///      No overcollateralization — reputation IS the collateral signal.
interface ILendingPool {
    // =========================================================================
    // ENUMS
    // =========================================================================

    /// @notice Current state of a loan
    enum LoanStatus {
        NONE,        // Does not exist
        ACTIVE,      // Borrowed, repayment ongoing
        REPAID,      // Fully repaid — positive reputation impact
        DEFAULTED,   // Missed repayment window — negative reputation impact
        LIQUIDATED   // Liquidated by protocol after default period
    }

    // =========================================================================
    // STRUCTS
    // =========================================================================

    /// @notice Full loan record stored on-chain
    struct Loan {
        uint256 loanId;
        address borrower;
        uint256 principal;          // Amount borrowed in asset decimals
        uint256 totalRepayable;     // Principal + interest at origination
        uint256 amountRepaid;       // Running total of repayments
        uint256 interestRate;       // Annual rate in basis points (e.g. 800 = 8%)
        uint48 originatedAt;        // Loan start timestamp
        uint48 dueAt;               // Full repayment deadline
        uint48 lastRepaidAt;        // Last repayment timestamp
        LoanStatus status;
        uint32 reputationScoreAtOrigination; // Snapshot of score when loan was taken
    }

    /// @notice Tier parameters derived from reputation score
    /// @dev Score 0–249: no access. 250–499: Tier1. 500–749: Tier2. 750–1000: Tier3
    struct LoanTier {
        uint32 minScore;            // Minimum reputation score for this tier
        uint256 maxLoanAmount;      // Maximum borrow amount in asset decimals
        uint256 interestRateBps;    // Annual interest rate in basis points
        uint48 loanDuration;        // Loan duration in seconds
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    /// @notice Emitted when a worker takes out a loan
    event LoanOriginated(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 principal,
        uint256 totalRepayable,
        uint48 dueAt,
        uint32 reputationScore
    );

    /// @notice Emitted on each repayment installment
    event LoanRepayment(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 remainingBalance,
        uint48 paidAt
    );

    /// @notice Emitted when a loan is fully repaid
    event LoanFullyRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint48 repaidAt
    );

    /// @notice Emitted when a loan is marked as defaulted
    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 outstandingBalance,
        uint48 defaultedAt
    );

    /// @notice Emitted when loan tier parameters are updated by governance
    event LoanTierUpdated(
        uint8 indexed tier,
        uint32 minScore,
        uint256 maxLoanAmount,
        uint256 interestRateBps,
        uint48 loanDuration
    );

    /// @notice Emitted when the pool is paused or unpaused
    event PoolPauseStateChanged(bool paused);

    // =========================================================================
    // ERRORS
    // =========================================================================

    error LendingPool__InsufficientReputation(uint32 score, uint32 required);
    error LendingPool__AmountExceedsTierLimit(uint256 requested, uint256 maximum);
    error LendingPool__InsufficientPoolLiquidity(uint256 requested, uint256 available);
    error LendingPool__ActiveLoanExists(address borrower, uint256 activeLoanId);
    error LendingPool__LoanNotFound(uint256 loanId);
    error LendingPool__LoanNotActive(uint256 loanId, LoanStatus status);
    error LendingPool__NotBorrower(address caller, address borrower);
    error LendingPool__ZeroAmount();
    error LendingPool__Paused();
    error LendingPool__RepaymentExceedsBalance(uint256 amount, uint256 remaining);
    error LendingPool__WorkerIdentityNotActive(address borrower);

    // =========================================================================
    // BORROWER FUNCTIONS
    // =========================================================================

    /// @notice Originate a new loan
    /// @dev Worker must have ACTIVE identity and no existing active loan
    ///      Loan terms are determined automatically by reputation score tier
    /// @param amount The principal amount to borrow in asset decimals
    /// @return loanId The newly created loan ID
    function borrow(uint256 amount) external returns (uint256 loanId);

    /// @notice Make a repayment on an active loan
    /// @dev Partial repayments accepted. Excess reverts.
    /// @param loanId The loan to repay
    /// @param amount The repayment amount in asset decimals
    function repay(uint256 loanId, uint256 amount) external;

    // =========================================================================
    // PROTOCOL FUNCTIONS
    // =========================================================================

    /// @notice Mark an overdue loan as defaulted — callable by keeper/governance
    /// @param loanId The loan to mark as defaulted
    function markDefault(uint256 loanId) external;

    /// @notice Update tier parameters — callable by governance only
    /// @param tier Tier index (0, 1, 2)
    /// @param params The new tier parameters
    function updateLoanTier(uint8 tier, LoanTier calldata params) external;

    /// @notice Pause or unpause the pool — callable by governance only
    /// @param paused True to pause, false to unpause
    function setPaused(bool paused) external;

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @notice Fetch full loan data
    /// @param loanId The loan to query
    /// @return The full Loan struct
    function getLoan(uint256 loanId) external view returns (Loan memory);

    /// @notice Get the active loan ID for a borrower (0 if none)
    /// @param borrower The worker's address
    /// @return loanId The active loan ID, or 0 if no active loan
    function getActiveLoan(address borrower) external view returns (uint256 loanId);

    /// @notice Get all historical loan IDs for a borrower
    /// @param borrower The worker's address
    /// @return Array of loan IDs in chronological order
    function getLoanHistory(address borrower) external view returns (uint256[] memory);

    /// @notice Get the loan tier applicable for a given reputation score
    /// @param score The reputation score to evaluate
    /// @return tier The tier index (0, 1, 2) — reverts if score too low
    /// @return params The full LoanTier parameters
    function getTierForScore(uint32 score)
        external
        view
        returns (uint8 tier, LoanTier memory params);

    /// @notice Get outstanding balance remaining on a loan
    /// @param loanId The loan to query
    /// @return The remaining amount to repay
    function getOutstandingBalance(uint256 loanId) external view returns (uint256);

    /// @notice Get total liquidity currently available for lending
    /// @return The available asset balance in the pool
    function availableLiquidity() external view returns (uint256);

    /// @notice Check if pool is currently paused
    function paused() external view returns (bool);
}