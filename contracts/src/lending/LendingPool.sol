// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ILendingPool} from "../interfaces/ILendingPool.sol";
import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {ReputationScore} from "../identity/ReputationScore.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LendingPool
/// @author Afolabi Emmanuel
/// @notice ERC-4626 reputation-backed micro-lending pool for VeraFlow.
///         Liquidity providers deposit stablecoins and earn yield from
///         interest paid by workers. Workers borrow against their on-chain
///         reputation score — no overcollateralization required.
///
/// @dev Architecture:
///      - Inherits ERC-4626 for the LP vault mechanics (deposit/withdraw/shares)
///      - Loan origination, repayment, and default are handled in this contract
///      - Reputation score determines loan tier, amount limit, and interest rate
///      - ReputationScore contract is notified of loan outcomes via writeLoanScore()
///      - One active loan per borrower at a time — enforced strictly
///      - LoanManager is a separate contract handling keeper/liquidation logic
///
///      Tier structure (set by governance, defaults below):
///        Tier 0: score 250–499 → max 500 USDC, 12% APR, 90 days
///        Tier 1: score 500–749 → max 2000 USDC, 9% APR, 180 days
///        Tier 2: score 750–1000 → max 5000 USDC, 6% APR, 365 days
contract LendingPool is ILendingPool, ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =========================================================================
    // STATE
    // =========================================================================

    IWorkerIdentity public immutable WORKER_IDENTITY;
    ReputationScore public immutable REPUTATION_SCORE;

    /// @notice The LoanManager contract — authorized to call markDefault()
    address public loanManager;

    /// @notice Monotonic loan ID counter — starts at 1
    uint256 private _nextLoanId;

    /// @notice loanId => Loan record
    mapping(uint256 => Loan) private _loans;

    /// @notice borrower => active loanId (0 = no active loan)
    mapping(address => uint256) private _activeLoan;

    /// @notice borrower => all historical loan IDs
    mapping(address => uint256[]) private _loanHistory;

    /// @notice Tier index => LoanTier parameters
    LoanTier[3] private _tiers;

    /// @notice Total principal currently outstanding across all active loans
    uint256 public totalOutstanding;

    /// @notice Pool pause state
    bool private _paused;

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier whenNotPaused() {
        _whenNotPaused();
        _;
    }

    modifier onlyLoanManager() {
        _onlyLoanManager();
        _;
    }

    function _whenNotPaused() internal view {
        if (_paused) revert LendingPool__Paused();
    }

    function _onlyLoanManager() internal view {
        if (msg.sender != loanManager && msg.sender != owner()) {
            revert LendingPool__LoanNotFound(0);
        }
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /// @param asset The ERC20 stablecoin used as pool asset (e.g. USDC)
    /// @param initialOwner Protocol multisig
    /// @param _workerIdentity WorkerIdentity contract
    /// @param _reputationScore ReputationScore contract
    constructor(
        IERC20 asset,
        address initialOwner,
        address _workerIdentity,
        address _reputationScore
    )
        ERC4626(asset)
        ERC20("VeraFlow LP Token", "vfLP")
        Ownable(initialOwner)
    {
        if (_workerIdentity == address(0) || _reputationScore == address(0)) {
            revert LendingPool__LoanNotFound(0);
        }

        WORKER_IDENTITY = IWorkerIdentity(_workerIdentity);
        REPUTATION_SCORE = ReputationScore(_reputationScore);

        _nextLoanId = 1;

        // Initialize default tier parameters
        // Tier 0: entry level
        _tiers[0] = LoanTier({
            minScore: 250,
            maxLoanAmount: 500e6,    // 500 USDC (6 decimals)
            interestRateBps: 1_200,  // 12% APR
            loanDuration: 90 days
        });

        // Tier 1: established worker
        _tiers[1] = LoanTier({
            minScore: 500,
            maxLoanAmount: 2_000e6,  // 2000 USDC
            interestRateBps: 900,    // 9% APR
            loanDuration: 180 days
        });

        // Tier 2: top reputation
        _tiers[2] = LoanTier({
            minScore: 750,
            maxLoanAmount: 5_000e6,  // 5000 USDC
            interestRateBps: 600,    // 6% APR
            loanDuration: 365 days
        });
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    function setLoanManager(address _loanManager) external onlyOwner {
        if (_loanManager == address(0)) revert LendingPool__ZeroAmount();
        loanManager = _loanManager;
    }

    /// @inheritdoc ILendingPool
    function updateLoanTier(uint8 tier, LoanTier calldata params)
        external
        override
        onlyOwner
    {
        require(tier < 3, "invalid tier");
        _tiers[tier] = params;
        emit LoanTierUpdated(
            tier,
            params.minScore,
            params.maxLoanAmount,
            params.interestRateBps,
            params.loanDuration
        );
    }

    /// @inheritdoc ILendingPool
    function setPaused(bool pauseState) external override onlyOwner {
        _paused = pauseState;
        emit PoolPauseStateChanged(pauseState);
    }

    // =========================================================================
    // BORROWER — BORROW
    // =========================================================================

    /// @inheritdoc ILendingPool
    function borrow(uint256 amount)
        external
        override
        whenNotPaused
        nonReentrant
        returns (uint256 loanId)
    {
        address borrower = msg.sender;

        // Validate identity
        if (!WORKER_IDENTITY.isActive(borrower)) {
            revert LendingPool__WorkerIdentityNotActive(borrower);
        }

        // Enforce one active loan per borrower
        if (_activeLoan[borrower] != 0) {
            revert LendingPool__ActiveLoanExists(borrower, _activeLoan[borrower]);
        }

        if (amount == 0) revert LendingPool__ZeroAmount();

        // Determine tier from current reputation score
        uint32 score = WORKER_IDENTITY.getReputationScore(borrower);
        (uint8 tierIndex, LoanTier memory tier) = getTierForScore(score);

        // Validate amount against tier limit
        if (amount > tier.maxLoanAmount) {
            revert LendingPool__AmountExceedsTierLimit(amount, tier.maxLoanAmount);
        }

        // Validate pool has enough liquidity
        uint256 liquid = availableLiquidity();
        if (amount > liquid) {
            revert LendingPool__InsufficientPoolLiquidity(amount, liquid);
        }

        // Compute interest: simple interest = principal * rate * duration / (365 days * 10000)
        uint256 interest = (amount * tier.interestRateBps * tier.loanDuration)
            / (365 days * 10_000);
        uint256 totalRepayable = amount + interest;

        loanId = _nextLoanId;
        unchecked { _nextLoanId++; }

        uint48 originatedAt = uint48(block.timestamp);
        uint48 dueAt = uint48(block.timestamp + tier.loanDuration);

        _loans[loanId] = Loan({
            loanId: loanId,
            borrower: borrower,
            principal: amount,
            totalRepayable: totalRepayable,
            amountRepaid: 0,
            interestRate: tier.interestRateBps,
            originatedAt: originatedAt,
            dueAt: dueAt,
            lastRepaidAt: 0,
            status: LoanStatus.ACTIVE,
            reputationScoreAtOrigination: score
        });

        _activeLoan[borrower] = loanId;
        _loanHistory[borrower].push(loanId);

        unchecked { totalOutstanding += amount; }

        // Transfer principal to borrower
        IERC20(asset()).safeTransfer(borrower, amount);

        emit LoanOriginated(
            loanId,
            borrower,
            amount,
            totalRepayable,
            dueAt,
            score
        );

        // Silence unused variable warning
        tierIndex;
    }

    // =========================================================================
    // BORROWER — REPAY
    // =========================================================================

    /// @inheritdoc ILendingPool
    function repay(uint256 loanId, uint256 amount)
        external
        override
        whenNotPaused
        nonReentrant
    {
        if (amount == 0) revert LendingPool__ZeroAmount();

        Loan storage loan = _loans[loanId];

        if (loan.loanId == 0) revert LendingPool__LoanNotFound(loanId);
        if (loan.status != LoanStatus.ACTIVE) {
            revert LendingPool__LoanNotActive(loanId, loan.status);
        }
        if (msg.sender != loan.borrower) {
            revert LendingPool__NotBorrower(msg.sender, loan.borrower);
        }

        uint256 remaining = loan.totalRepayable - loan.amountRepaid;
        if (amount > remaining) {
            revert LendingPool__RepaymentExceedsBalance(amount, remaining);
        }

        // Pull repayment from borrower
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);

        unchecked { loan.amountRepaid += amount; }
        loan.lastRepaidAt = uint48(block.timestamp);

        uint256 newRemaining = loan.totalRepayable - loan.amountRepaid;

        emit LoanRepayment(loanId, msg.sender, amount, newRemaining, uint48(block.timestamp));

        // Check if fully repaid
        if (loan.amountRepaid >= loan.totalRepayable) {
            loan.status = LoanStatus.REPAID;
            _activeLoan[loan.borrower] = 0;

            // Reduce outstanding principal
            if (totalOutstanding >= loan.principal) {
                unchecked { totalOutstanding -= loan.principal; }
            }

            // Reward on-time vs early repayment
            bool early = block.timestamp < loan.dueAt;
            int32 scoreDelta = early ? int32(70) : int32(60);

            try REPUTATION_SCORE.writeLoanScore(loan.borrower, scoreDelta) {}
            catch {}

            emit LoanFullyRepaid(loanId, loan.borrower, uint48(block.timestamp));
        }
    }

    // =========================================================================
    // PROTOCOL — DEFAULT
    // =========================================================================

    /// @inheritdoc ILendingPool
    function markDefault(uint256 loanId)
        external
        override
        onlyLoanManager
        nonReentrant
    {
        Loan storage loan = _loans[loanId];

        if (loan.loanId == 0) revert LendingPool__LoanNotFound(loanId);
        if (loan.status != LoanStatus.ACTIVE) {
            revert LendingPool__LoanNotActive(loanId, loan.status);
        }
        if (block.timestamp <= loan.dueAt) {
            revert LendingPool__LoanNotActive(loanId, loan.status);
        }

        uint256 outstanding = loan.totalRepayable - loan.amountRepaid;

        loan.status = LoanStatus.DEFAULTED;
        _activeLoan[loan.borrower] = 0;

        if (totalOutstanding >= loan.principal) {
            unchecked { totalOutstanding -= loan.principal; }
        }

        // Heavy reputation penalty for default
        try REPUTATION_SCORE.writeLoanScore(loan.borrower, int32(-150)) {}
        catch {}

        emit LoanDefaulted(
            loanId,
            loan.borrower,
            outstanding,
            uint48(block.timestamp)
        );
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @inheritdoc ILendingPool
    function getLoan(uint256 loanId)
        external
        view
        override
        returns (Loan memory)
    {
        return _loans[loanId];
    }

    /// @inheritdoc ILendingPool
    function getActiveLoan(address borrower)
        external
        view
        override
        returns (uint256)
    {
        return _activeLoan[borrower];
    }

    /// @inheritdoc ILendingPool
    function getLoanHistory(address borrower)
        external
        view
        override
        returns (uint256[] memory)
    {
        return _loanHistory[borrower];
    }

    /// @inheritdoc ILendingPool
    function getTierForScore(uint32 score)
        public
        view
        override
        returns (uint8 tier, LoanTier memory params)
    {
        // Check from highest tier down
        for (uint8 i = 2; i < 3;) {
            if (score >= _tiers[i].minScore) {
                return (i, _tiers[i]);
            }
            if (i == 0) break;
            unchecked { i--; }
        }

        revert LendingPool__InsufficientReputation(score, _tiers[0].minScore);
    }

    /// @inheritdoc ILendingPool
    function getOutstandingBalance(uint256 loanId)
        external
        view
        override
        returns (uint256)
    {
        Loan storage loan = _loans[loanId];
        if (loan.loanId == 0) revert LendingPool__LoanNotFound(loanId);
        if (loan.status != LoanStatus.ACTIVE) return 0;
        return loan.totalRepayable - loan.amountRepaid;
    }

    /// @inheritdoc ILendingPool
    function availableLiquidity() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) - totalOutstanding;
    }

    /// @inheritdoc ILendingPool
    function paused() external view override returns (bool) {
        return _paused;
    }

    // =========================================================================
    // ERC-4626 OVERRIDES
    // =========================================================================

    /// @dev Total assets includes outstanding loans — they are protocol assets
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }
}