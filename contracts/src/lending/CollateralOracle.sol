// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {LendingPool} from "./LendingPool.sol";
import {ReputationScore} from "../identity/ReputationScore.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CollateralOracle
/// @author Afolabi Emmanuel
/// @notice Read-only oracle that converts a worker's reputation score into
///         a maximum borrowing capacity expressed in asset decimals.
///         Used by the LendingPool and external integrations to determine
///         how much a worker can borrow without overcollateralization.
///
/// @dev This contract is intentionally stateless for the core logic.
///      All data is read from LendingPool tiers and WorkerIdentity scores.
///      External DeFi protocols on Avalanche C-Chain can query this oracle
///      via Avalanche ICM (Warp) to gate their own services by VeraFlow score.
///
///      Credit limit formula:
///        creditLimit = tierMaxLoanAmount * (score / tierMaxScore) * utilizationMultiplier
///
///      Utilization multiplier rewards workers who have repaid loans before:
///        - No loan history:    1.0x (base)
///        - 1 repaid loan:      1.1x
///        - 2+ repaid loans:    1.25x
///        - Any default:        0.5x (hard penalty, regardless of repaid count)
contract CollateralOracle is Ownable {
    // =========================================================================
    // STATE
    // =========================================================================

    IWorkerIdentity public immutable WORKER_IDENTITY;
    LendingPool public immutable LENDING_POOL;
    ReputationScore public immutable REPUTATION_SCORE;

    /// @notice Precision factor for fixed-point multiplier math (2 decimals)
    uint256 private constant PRECISION = 100;

    /// @notice Utilization multipliers in PRECISION units
    uint256 public multiplierBase = 100;        // 1.00x
    uint256 public multiplierOneRepaid = 110;   // 1.10x
    uint256 public multiplierTwoRepaid = 125;   // 1.25x
    uint256 public multiplierDefault = 50;      // 0.50x

    // =========================================================================
    // EVENTS
    // =========================================================================

    event MultipliersUpdated(
        uint256 base,
        uint256 oneRepaid,
        uint256 twoRepaid,
        uint256 defaultPenalty
    );

    // =========================================================================
    // ERRORS
    // =========================================================================

    error CollateralOracle__ZeroAddress();
    error CollateralOracle__WorkerNotActive(address wallet);
    error CollateralOracle__InvalidMultiplier();

    // =========================================================================
    // STRUCTS
    // =========================================================================

    /// @notice Full credit assessment for a worker
    struct CreditAssessment {
        address wallet;
        uint32 reputationScore;
        uint8 tierIndex;
        uint256 tierMaxAmount;      // Raw tier maximum
        uint256 creditLimit;        // Adjusted credit limit after multiplier
        uint256 multiplierBps;      // Applied multiplier in PRECISION units
        bool hasActiveDefault;      // True if any loan is currently defaulted
        uint256 repaidLoanCount;    // Number of successfully repaid loans
        bool eligible;              // True if score meets minimum tier requirement
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(
        address initialOwner,
        address _workerIdentity,
        address _lendingPool,
        address _reputationScore
    ) Ownable(initialOwner) {
        if (
            _workerIdentity == address(0)
            || _lendingPool == address(0)
            || _reputationScore == address(0)
        ) revert CollateralOracle__ZeroAddress();

        WORKER_IDENTITY = IWorkerIdentity(_workerIdentity);
        LENDING_POOL = LendingPool(_lendingPool);
        REPUTATION_SCORE = ReputationScore(_reputationScore);
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    /// @notice Update utilization multipliers
    /// @dev All values in PRECISION units (100 = 1.00x)
    function setMultipliers(
        uint256 base,
        uint256 oneRepaid,
        uint256 twoRepaid,
        uint256 defaultPenalty
    ) external onlyOwner {
        if (base == 0 || oneRepaid == 0 || twoRepaid == 0 || defaultPenalty == 0) {
            revert CollateralOracle__InvalidMultiplier();
        }
        multiplierBase = base;
        multiplierOneRepaid = oneRepaid;
        multiplierTwoRepaid = twoRepaid;
        multiplierDefault = defaultPenalty;

        emit MultipliersUpdated(base, oneRepaid, twoRepaid, defaultPenalty);
    }

    // =========================================================================
    // CORE — CREDIT LIMIT
    // =========================================================================

    /// @notice Get the maximum borrow amount for a worker right now
    /// @dev Primary function called by LendingPool before originating a loan
    /// @param wallet The worker to assess
    /// @return creditLimit The maximum amount they can borrow in asset decimals
    function getCreditLimit(address wallet) external view returns (uint256 creditLimit) {
        CreditAssessment memory assessment = assess(wallet);
        return assessment.creditLimit;
    }

    /// @notice Full credit assessment with all components
    /// @param wallet The worker to assess
    /// @return Full CreditAssessment struct
    function assess(address wallet)
        public
        view
        returns (CreditAssessment memory)
    {
        CreditAssessment memory result;
        result.wallet = wallet;

        // Must have active identity
        if (!WORKER_IDENTITY.isActive(wallet)) {
            result.eligible = false;
            return result;
        }

        result.reputationScore = WORKER_IDENTITY.getReputationScore(wallet);

        // Try to get tier — reverts if score too low
        try LENDING_POOL.getTierForScore(result.reputationScore)
            returns (uint8 tierIndex, ILendingPool.LoanTier memory tier)
        {
            result.eligible = true;
            result.tierIndex = tierIndex;
            result.tierMaxAmount = tier.maxLoanAmount;
        } catch {
            result.eligible = false;
            return result;
        }

        // Analyze loan history for multiplier
        (
            result.repaidLoanCount,
            result.hasActiveDefault
        ) = _analyzeLoanHistory(wallet);

        // Determine multiplier
        result.multiplierBps = _selectMultiplier(
            result.repaidLoanCount,
            result.hasActiveDefault
        );

        // Apply multiplier to tier max
        result.creditLimit = (result.tierMaxAmount * result.multiplierBps) / PRECISION;

        return result;
    }

    /// @notice Check if a specific borrow amount is within a worker's credit limit
    /// @param wallet The worker
    /// @param amount The requested borrow amount
    /// @return True if amount is within credit limit and worker is eligible
    function isWithinCreditLimit(address wallet, uint256 amount)
        external
        view
        returns (bool)
    {
        CreditAssessment memory assessment = assess(wallet);
        if (!assessment.eligible) return false;
        return amount <= assessment.creditLimit;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    /// @dev Scan loan history to count repaid loans and detect defaults
    function _analyzeLoanHistory(address wallet)
        internal
        view
        returns (uint256 repaidCount, bool hasDefault)
    {
        uint256[] memory loanIds = LENDING_POOL.getLoanHistory(wallet);

        for (uint256 i = 0; i < loanIds.length;) {
            ILendingPool.Loan memory loan = LENDING_POOL.getLoan(loanIds[i]);

            if (loan.status == ILendingPool.LoanStatus.REPAID) {
                unchecked { repaidCount++; }
            } else if (
                loan.status == ILendingPool.LoanStatus.DEFAULTED
                || loan.status == ILendingPool.LoanStatus.LIQUIDATED
            ) {
                hasDefault = true;
            }

            unchecked { i++; }
        }
    }

    /// @dev Select the appropriate multiplier based on loan history
    function _selectMultiplier(uint256 repaidCount, bool hasDefault)
        internal
        view
        returns (uint256)
    {
        // Default penalty overrides all positive history
        if (hasDefault) return multiplierDefault;

        if (repaidCount >= 2) return multiplierTwoRepaid;
        if (repaidCount == 1) return multiplierOneRepaid;
        return multiplierBase;
    }
}