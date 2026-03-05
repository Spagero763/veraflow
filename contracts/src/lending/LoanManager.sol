// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {LendingPool} from "./LendingPool.sol";
import {ReputationScore} from "../identity/ReputationScore.sol";
import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LoanManager
/// @author Afolabi Emmanuel
/// @notice Keeper and lifecycle manager for VeraFlow loans.
///         Handles default detection, batch processing of overdue loans,
///         and provides the external interface for loan administration.
///
/// @dev Separation of concerns:
///      - LendingPool owns funds and loan state
///      - LoanManager is the authorized keeper that triggers state transitions
///      - Anyone can call processOverdueLoans() — permissionless keeper design
///      - Owner can set grace period and batch size parameters
///
///      Grace period: loans are not defaulted immediately after dueAt.
///      A configurable grace period allows late repayments before default.
///      This is important for real-world users who may miss by hours/days.
contract LoanManager is Ownable, ReentrancyGuard {
    // =========================================================================
    // STATE
    // =========================================================================

    LendingPool public immutable LENDING_POOL;
    ReputationScore public immutable REPUTATION_SCORE;
    IWorkerIdentity public immutable WORKER_IDENTITY;

    /// @notice Grace period after dueAt before a loan can be defaulted
    /// @dev Default: 3 days. Governance can adjust.
    uint256 public gracePeriod;

    /// @notice Maximum loans processed in a single batch default call
    uint256 public maxBatchSize;

    /// @notice Tracks which loanIds have been queued for default processing
    /// @dev loanId => true if queued
    mapping(uint256 => bool) public isQueuedForDefault;

    /// @notice List of loan IDs pending default review
    uint256[] private _defaultQueue;

    /// @notice loanId => index in _defaultQueue for O(1) removal
    mapping(uint256 => uint256) private _defaultQueueIndex;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event LoanQueuedForDefault(
        uint256 indexed loanId,
        address indexed borrower,
        uint48 dueAt,
        uint48 queuedAt
    );

    event LoanRemovedFromQueue(
        uint256 indexed loanId,
        string reason
    );

    event BatchDefaultProcessed(
        uint256 loansProcessed,
        uint256 loansDefaulted,
        uint256 loansSkipped,
        uint48 processedAt
    );

    event GracePeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event MaxBatchSizeUpdated(uint256 oldSize, uint256 newSize);

    // =========================================================================
    // ERRORS
    // =========================================================================

    error LoanManager__ZeroAddress();
    error LoanManager__LoanNotOverdue(uint256 loanId, uint48 dueAt);
    error LoanManager__LoanAlreadyQueued(uint256 loanId);
    error LoanManager__InvalidBatchSize();
    error LoanManager__EmptyQueue();

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(
        address initialOwner,
        address _lendingPool,
        address _reputationScore,
        address _workerIdentity
    ) Ownable(initialOwner) {
        if (
            _lendingPool == address(0)
            || _reputationScore == address(0)
            || _workerIdentity == address(0)
        ) revert LoanManager__ZeroAddress();

        LENDING_POOL = LendingPool(_lendingPool);
        REPUTATION_SCORE = ReputationScore(_reputationScore);
        WORKER_IDENTITY = IWorkerIdentity(_workerIdentity);

        gracePeriod = 3 days;
        maxBatchSize = 50;
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    /// @notice Update the grace period before a loan can be defaulted
    /// @param newGracePeriod New grace period in seconds
    function setGracePeriod(uint256 newGracePeriod) external onlyOwner {
        emit GracePeriodUpdated(gracePeriod, newGracePeriod);
        gracePeriod = newGracePeriod;
    }

    /// @notice Update the maximum batch size for default processing
    function setMaxBatchSize(uint256 newSize) external onlyOwner {
        if (newSize == 0) revert LoanManager__InvalidBatchSize();
        emit MaxBatchSizeUpdated(maxBatchSize, newSize);
        maxBatchSize = newSize;
    }

    // =========================================================================
    // QUEUE MANAGEMENT
    // =========================================================================

    /// @notice Queue an overdue loan for default processing
    /// @dev Permissionless — anyone can queue an overdue loan
    ///      This incentivizes keepers to monitor and queue loans
    /// @param loanId The loan to queue
    function queueForDefault(uint256 loanId) external nonReentrant {
        ILendingPool.Loan memory loan = LENDING_POOL.getLoan(loanId);

        // Loan must be active
        if (loan.status != ILendingPool.LoanStatus.ACTIVE) {
            revert LoanManager__LoanNotOverdue(loanId, loan.dueAt);
        }

        // Must be past dueAt + grace period
        if (block.timestamp <= loan.dueAt + gracePeriod) {
            revert LoanManager__LoanNotOverdue(loanId, loan.dueAt);
        }

        // Not already queued
        if (isQueuedForDefault[loanId]) {
            revert LoanManager__LoanAlreadyQueued(loanId);
        }

        isQueuedForDefault[loanId] = true;
        _defaultQueueIndex[loanId] = _defaultQueue.length;
        _defaultQueue.push(loanId);

        emit LoanQueuedForDefault(
            loanId,
            loan.borrower,
            loan.dueAt,
            uint48(block.timestamp)
        );
    }

    /// @notice Process all queued overdue loans up to maxBatchSize
    /// @dev Permissionless keeper function — anyone can call this
    ///      Uses try/catch so one failure doesn't block the entire batch
    function processOverdueLoans() external nonReentrant {
        uint256 queueLength = _defaultQueue.length;
        if (queueLength == 0) revert LoanManager__EmptyQueue();

        uint256 batchLimit = queueLength < maxBatchSize
            ? queueLength
            : maxBatchSize;

        uint256 defaulted = 0;
        uint256 skipped = 0;
        uint256 processed = 0;

        // Process from the end of the queue (cheaper removal)
        uint256 i = queueLength;
        while (i > 0 && processed < batchLimit) {
            unchecked { i--; }

            uint256 loanId = _defaultQueue[i];

            // Re-validate — loan may have been repaid since queuing
            ILendingPool.Loan memory loan = LENDING_POOL.getLoan(loanId);

            if (loan.status != ILendingPool.LoanStatus.ACTIVE) {
                // Already resolved — just remove from queue
                _removeFromQueue(loanId);
                emit LoanRemovedFromQueue(loanId, "already resolved");
                unchecked { skipped++; processed++; }
                continue;
            }

            // Attempt to default
            try LENDING_POOL.markDefault(loanId) {
                _removeFromQueue(loanId);
                unchecked { defaulted++; }
            } catch {
                // Mark as skipped — will retry next batch
                unchecked { skipped++; }
            }

            unchecked { processed++; }
        }

        emit BatchDefaultProcessed(
            processed,
            defaulted,
            skipped,
            uint48(block.timestamp)
        );
    }

    /// @notice Manually remove a loan from the default queue
    /// @dev Owner only — for edge cases where queue needs manual intervention
    function removeFromQueue(uint256 loanId, string calldata reason)
        external
        onlyOwner
    {
        if (!isQueuedForDefault[loanId]) return;
        _removeFromQueue(loanId);
        emit LoanRemovedFromQueue(loanId, reason);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @notice Get the current default queue length
    function defaultQueueLength() external view returns (uint256) {
        return _defaultQueue.length;
    }

    /// @notice Get a page of the default queue
    /// @param offset Start index
    /// @param limit Max results
    function getDefaultQueue(uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory)
    {
        uint256 total = _defaultQueue.length;
        if (offset >= total) return new uint256[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end;) {
            result[i - offset] = _defaultQueue[i];
            unchecked { i++; }
        }
        return result;
    }

    /// @notice Check if a specific loan is overdue and eligible for queuing
    /// @param loanId The loan to check
    /// @return True if loan is active and past dueAt + gracePeriod
    function isOverdue(uint256 loanId) external view returns (bool) {
        ILendingPool.Loan memory loan = LENDING_POOL.getLoan(loanId);
        return loan.status == ILendingPool.LoanStatus.ACTIVE
            && block.timestamp > loan.dueAt + gracePeriod;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    /// @dev Swap-and-pop removal from default queue — O(1)
    function _removeFromQueue(uint256 loanId) internal {
        uint256 index = _defaultQueueIndex[loanId];
        uint256 lastIndex = _defaultQueue.length - 1;

        if (index != lastIndex) {
            uint256 lastLoanId = _defaultQueue[lastIndex];
            _defaultQueue[index] = lastLoanId;
            _defaultQueueIndex[lastLoanId] = index;
        }

        _defaultQueue.pop();
        delete _defaultQueueIndex[loanId];
        delete isQueuedForDefault[loanId];
    }
}