// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {ICredential} from "../interfaces/ICredential.sol";
import {SoulboundCredential} from "../core/SoulboundCredential.sol";
import {CredentialRegistry} from "../core/CredentialRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ReputationScore
/// @author Afolabi Emmanuel
/// @notice On-chain credit scoring engine for VeraFlow workers.
///         Computes a deterministic reputation score (0–1000) from verifiable
///         on-chain data — no oracles, no off-chain inputs, no admin overrides.
///
/// @dev Scoring model (total 1000 points):
///
///      CREDENTIAL SCORE (400 pts max)
///      ─────────────────────────────
///      Each valid credential contributes points based on type and issuer trust:
///        - DEGREE        from PREMIUM issuer  = 120 pts
///        - DEGREE        from VERIFIED issuer = 100 pts
///        - LICENSE       from PREMIUM issuer  =  90 pts
///        - LICENSE       from VERIFIED issuer =  75 pts
///        - CERTIFICATION from PREMIUM issuer  =  60 pts
///        - CERTIFICATION from VERIFIED issuer =  50 pts
///        - EMPLOYMENT    any trusted issuer   =  40 pts per record (max 2)
///        - SKILL/IDENTITY                     =  15 pts each (max 3)
///      Capped at 400 pts total.
///
///      LONGEVITY SCORE (200 pts max)
///      ─────────────────────────────
///      Based on how long the worker's oldest credential has been valid:
///        - >= 4 years  = 200 pts
///        - >= 2 years  = 150 pts
///        - >= 1 year   = 100 pts
///        - >= 6 months =  50 pts
///        - < 6 months  =   0 pts
///
///      LOAN HISTORY SCORE (300 pts max)
///      ─────────────────────────────────
///      Written by LoanManager after each loan lifecycle event:
///        - Full on-time repayment  = +60 pts per loan (max 5 loans = 300)
///        - Early repayment bonus   = +10 pts
///        - Default                 = -150 pts
///        - Written directly via writeLoanScore()
///
///      IDENTITY AGE SCORE (100 pts max)
///      ─────────────────────────────────
///      Based on how long the worker has been registered:
///        - >= 2 years  = 100 pts
///        - >= 1 year   =  75 pts
///        - >= 6 months =  50 pts
///        - < 6 months  =  25 pts (floor for registered identities)
///
///      Score is recomputed on-demand via computeAndWrite().
///      LoanManager writes loan score delta directly via writeLoanScore().
///      Final score is pushed to WorkerIdentity for protocol-wide consumption.
contract ReputationScore is Ownable, ReentrancyGuard {
    // =========================================================================
    // CONSTANTS
    // =========================================================================

    uint32 public constant MAX_SCORE = 1_000;
    uint32 public constant MAX_CREDENTIAL_SCORE = 400;
    uint32 public constant MAX_LONGEVITY_SCORE = 200;
    uint32 public constant MAX_LOAN_SCORE = 300;
    uint32 public constant MAX_IDENTITY_AGE_SCORE = 100;

    uint256 private constant SECONDS_PER_MONTH = 30 days;
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    // =========================================================================
    // STATE
    // =========================================================================

    IWorkerIdentity public immutable WORKER_IDENTITY;
    SoulboundCredential public immutable CREDENTIAL_NFT;
    CredentialRegistry public immutable REGISTRY;

    /// @notice The LoanManager contract — only it can write loan score deltas
    address public loanManager;

    /// @notice wallet => accumulated loan score (0–300)
    /// @dev Written by LoanManager, bounded, never exceeds MAX_LOAN_SCORE
    mapping(address => uint32) private _loanScores;

    /// @notice wallet => timestamp of last full score computation
    mapping(address => uint48) public lastComputedAt;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event ScoreComputed(
        address indexed wallet,
        uint32 credentialScore,
        uint32 longevityScore,
        uint32 loanScore,
        uint32 identityAgeScore,
        uint32 totalScore,
        uint48 computedAt
    );

    event LoanScoreUpdated(
        address indexed wallet,
        uint32 oldLoanScore,
        uint32 newLoanScore,
        bool isPositive
    );

    event LoanManagerUpdated(address oldManager, address newManager);

    // =========================================================================
    // ERRORS
    // =========================================================================

    error ReputationScore__NotRegistered(address wallet);
    error ReputationScore__ZeroAddress();
    error ReputationScore__Unauthorized(address caller);
    error ReputationScore__LoanScoreOverflow(uint32 current, int32 delta);

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(
        address initialOwner,
        address _workerIdentity,
        address _credentialNft,
        address _registry
    ) Ownable(initialOwner) {
        if (
            _workerIdentity == address(0)
            || _credentialNft == address(0)
            || _registry == address(0)
        ) revert ReputationScore__ZeroAddress();

        WORKER_IDENTITY = IWorkerIdentity(_workerIdentity);
        CREDENTIAL_NFT = SoulboundCredential(_credentialNft);
        REGISTRY = CredentialRegistry(_registry);
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    /// @notice Set the LoanManager contract address
    function setLoanManager(address _loanManager) external onlyOwner {
        if (_loanManager == address(0)) revert ReputationScore__ZeroAddress();
        emit LoanManagerUpdated(loanManager, _loanManager);
        loanManager = _loanManager;
    }

    // =========================================================================
    // CORE — COMPUTE AND WRITE
    // =========================================================================

    /// @notice Compute full reputation score for a worker and write to identity
    /// @dev Anyone can trigger a recompute — score is fully deterministic
    ///      from on-chain state. Caller pays gas.
    /// @param wallet The worker to score
    function computeAndWrite(address wallet) external nonReentrant {
        if (!WORKER_IDENTITY.isActive(wallet)) {
            revert ReputationScore__NotRegistered(wallet);
        }

        (
            uint32 credScore,
            uint32 longevityScore,
            uint32 identityAgeScore
        ) = _computeCredentialAndLongevityScore(wallet);

        uint32 loanScore = _loanScores[wallet];

        // Sum all components — each is already bounded by its max
        uint32 total = credScore + longevityScore + loanScore + identityAgeScore;

        // Hard cap — should never exceed 1000 by design, but guard anyway
        if (total > MAX_SCORE) total = MAX_SCORE;

        // Write to WorkerIdentity — single source of truth for the protocol
        WORKER_IDENTITY.writeReputationScore(wallet, total);

        lastComputedAt[wallet] = uint48(block.timestamp);

        emit ScoreComputed(
            wallet,
            credScore,
            longevityScore,
            loanScore,
            identityAgeScore,
            total,
            uint48(block.timestamp)
        );
    }

    /// @notice Apply a loan score delta — callable only by LoanManager
    /// @param wallet The worker whose loan score to update
    /// @param delta Signed delta — positive for repayment, negative for default
    function writeLoanScore(address wallet, int32 delta)
        external
        nonReentrant
    {
        if (msg.sender != loanManager) {
            revert ReputationScore__Unauthorized(msg.sender);
        }
        if (!WORKER_IDENTITY.isActive(wallet)) {
            revert ReputationScore__NotRegistered(wallet);
        }

        uint32 current = _loanScores[wallet];
        uint32 newScore;

        if (delta >= 0) {
            // forge-lint: disable-next-line(unsafe-typecast)
            uint32 increase = uint32(delta); // safe: delta > 0 and bounded by MAX_LOAN_SCORE (300)
            newScore = current + increase;
            if (newScore > MAX_LOAN_SCORE) newScore = MAX_LOAN_SCORE;
        } else {
            // forge-lint: disable-next-line(unsafe-typecast)
            uint32 decrease = uint32(-delta); // safe: -delta > 0 and bounded by MAX_LOAN_SCORE (300)
            newScore = current > decrease ? current - decrease : 0;
        }

        bool isPositive = delta >= 0;
        _loanScores[wallet] = newScore;

        emit LoanScoreUpdated(wallet, current, newScore, isPositive);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @notice Preview score breakdown without writing — gas efficient read
    /// @param wallet The worker to evaluate
    /// @return credScore Credential component (0–400)
    /// @return longevityScore Longevity component (0–200)
    /// @return loanScore Loan history component (0–300)
    /// @return identityAgeScore Identity age component (0–100)
    /// @return total Sum of all components (0–1000)
    function previewScore(address wallet)
        external
        view
        returns (
            uint32 credScore,
            uint32 longevityScore,
            uint32 loanScore,
            uint32 identityAgeScore,
            uint32 total
        )
    {
        (credScore, longevityScore, identityAgeScore) =
            _computeCredentialAndLongevityScore(wallet);

        loanScore = _loanScores[wallet];
        total = credScore + longevityScore + loanScore + identityAgeScore;
        if (total > MAX_SCORE) total = MAX_SCORE;
    }

    /// @notice Get the current loan score for a worker
    function getLoanScore(address wallet) external view returns (uint32) {
        return _loanScores[wallet];
    }

    // =========================================================================
    // INTERNAL — SCORING ENGINE
    // =========================================================================

    /// @dev Compute credential score, longevity score, and identity age score
    ///      Pure read from on-chain state — no storage writes
    function _computeCredentialAndLongevityScore(address wallet)
        internal
        view
        returns (
            uint32 credScore,
            uint32 longevityScore,
            uint32 identityAgeScore
        )
    {
        IWorkerIdentity.Identity memory identity = WORKER_IDENTITY.getIdentity(wallet);

        // Identity age score
        identityAgeScore = _computeIdentityAgeScore(identity.registeredAt);

        // Fetch all credentials held by this worker
        uint256[] memory tokenIds = CREDENTIAL_NFT.getCredentialsByHolder(wallet);

        if (tokenIds.length == 0) {
            return (0, 0, identityAgeScore);
        }

        uint32 rawCredScore = 0;
        uint48 oldestIssuedAt = type(uint48).max;
        uint256 employmentCount = 0;
        uint256 skillCount = 0;

        for (uint256 i = 0; i < tokenIds.length;) {
            try CREDENTIAL_NFT.getCredential(tokenIds[i]) returns (
                ICredential.Credential memory cred
            ) {
                // Only score valid, non-revoked, non-expired credentials
                // from currently trusted issuers
                bool expired = cred.expiresAt != 0
                    && block.timestamp > cred.expiresAt;

                if (!cred.revoked && !expired && REGISTRY.isApproved(cred.issuer)) {
                    CredentialRegistry.TrustLevel trustLevel =
                        REGISTRY.getInstitution(cred.issuer).trustLevel;

                    bool isPremium =
                        trustLevel == CredentialRegistry.TrustLevel.PREMIUM;

                    rawCredScore += _scoreForCredential(
                        cred.credentialType,
                        isPremium,
                        employmentCount,
                        skillCount
                    );

                    // Track employment and skill counts for caps
                    if (cred.credentialType == ICredential.CredentialType.EMPLOYMENT) {
                        unchecked { employmentCount++; }
                    } else if (
                        cred.credentialType == ICredential.CredentialType.SKILL
                        || cred.credentialType == ICredential.CredentialType.IDENTITY
                    ) {
                        unchecked { skillCount++; }
                    }

                    // Track oldest credential for longevity score
                    if (cred.issuedAt < oldestIssuedAt) {
                        oldestIssuedAt = cred.issuedAt;
                    }
                }
            } catch {}

            unchecked { i++; }
        }

        // Cap credential score
        credScore = rawCredScore > MAX_CREDENTIAL_SCORE
            ? MAX_CREDENTIAL_SCORE
            : rawCredScore;

        // Longevity based on oldest valid credential
        longevityScore = oldestIssuedAt == type(uint48).max
            ? 0
            : _computeLongevityScore(oldestIssuedAt);
    }

    /// @dev Point value for a single credential based on type and issuer tier
    function _scoreForCredential(
        ICredential.CredentialType credType,
        bool isPremium,
        uint256 employmentCount,
        uint256 skillCount
    )
        internal
        pure
        returns (uint32 points)
    {
        if (credType == ICredential.CredentialType.DEGREE) {
            return isPremium ? 120 : 100;
        }

        if (credType == ICredential.CredentialType.LICENSE) {
            return isPremium ? 90 : 75;
        }

        if (credType == ICredential.CredentialType.CERTIFICATION) {
            return isPremium ? 60 : 50;
        }

        if (credType == ICredential.CredentialType.EMPLOYMENT) {
            // Cap at 2 employment records
            return employmentCount < 2 ? 40 : 0;
        }

        if (
            credType == ICredential.CredentialType.SKILL
            || credType == ICredential.CredentialType.IDENTITY
        ) {
            // Cap at 3 skill/identity credentials
            return skillCount < 3 ? 15 : 0;
        }

        return 0;
    }

    /// @dev Longevity score based on age of oldest valid credential
    function _computeLongevityScore(uint48 oldestIssuedAt)
        internal
        view
        returns (uint32)
    {
        uint256 age = block.timestamp - uint256(oldestIssuedAt);

        if (age >= 4 * SECONDS_PER_YEAR) return 200;
        if (age >= 2 * SECONDS_PER_YEAR) return 150;
        if (age >= SECONDS_PER_YEAR) return 100;
        if (age >= 6 * SECONDS_PER_MONTH) return 50;
        return 0;
    }

    /// @dev Identity age score based on registration timestamp
    function _computeIdentityAgeScore(uint48 registeredAt)
        internal
        view
        returns (uint32)
    {
        uint256 age = block.timestamp - uint256(registeredAt);

        if (age >= 2 * SECONDS_PER_YEAR) return 100;
        if (age >= SECONDS_PER_YEAR) return 75;
        if (age >= 6 * SECONDS_PER_MONTH) return 50;
        return 25; // Floor for any registered identity
    }
}