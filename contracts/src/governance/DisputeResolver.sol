// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {SoulboundCredential} from "../core/SoulboundCredential.sol";
import {WorkerIdentity} from "../identity/WorkerIdentity.sol";
import {CredentialRegistry} from "../core/CredentialRegistry.sol";
import {ICredential} from "../interfaces/ICredential.sol";
import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DisputeResolver
/// @author Afolabi Emmanuel
/// @notice Handles disputes raised against credentials or worker identities.
///         Workers can challenge fraudulent credentials issued in their name.
///         Employers can flag credentials that appear to be forged or invalid.
///         Council resolves disputes and can trigger revocation or suspension.
///
/// @dev Dispute lifecycle:
///      1. Any address can RAISE a dispute (with a stake to prevent spam)
///      2. Council members VOTE on the dispute
///      3. On resolution: UPHELD or DISMISSED
///         - UPHELD: credential is revoked OR worker is suspended
///         - DISMISSED: dispute closed, stake returned to raiser
///      4. Malicious disputes (spam): stake is slashed to protocol treasury
///
///      Stake requirement prevents griefing attacks on legitimate institutions
///      and workers. Stake is returned on DISMISSED disputes.
contract DisputeResolver is Ownable, ReentrancyGuard {
    // =========================================================================
    // TYPES
    // =========================================================================

    enum DisputeType {
        CREDENTIAL_FRAUD,       // Credential is forged or incorrectly issued
        IDENTITY_IMPERSONATION, // Someone registered an identity fraudulently
        INSTITUTION_MISCONDUCT  // Institution is issuing credentials improperly
    }

    enum DisputeStatus {
        OPEN,       // Awaiting council vote
        UPHELD,     // Dispute valid — remediation executed
        DISMISSED,  // Dispute invalid — stake returned
        EXPIRED     // Voting window passed without resolution
    }

    struct Dispute {
        uint256 disputeId;
        DisputeType disputeType;
        DisputeStatus status;
        address raiser;         // Who raised the dispute
        address target;         // Credential tokenId cast to address, or wallet
        uint256 targetTokenId;  // 0 if not a credential dispute
        string evidence;        // IPFS CID of evidence document
        uint256 stake;          // ETH staked by raiser
        uint48 createdAt;
        uint48 expiresAt;
        uint32 voteCount;
        uint32 requiredQuorum;
        string resolution;      // Council's written resolution
    }

    // =========================================================================
    // STATE
    // =========================================================================

    SoulboundCredential public immutable CREDENTIAL_NFT;
    WorkerIdentity public immutable WORKER_IDENTITY;
    CredentialRegistry public immutable REGISTRY;

    /// @notice Council members authorized to vote on disputes
    mapping(address => bool) public isCouncilMember;

    /// @notice disputeId => Dispute
    mapping(uint256 => Dispute) private _disputes;

    /// @notice disputeId => voter => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Protocol treasury — receives slashed stakes
    address public treasury;

    uint256 private _nextDisputeId;

    /// @notice Minimum stake required to raise a dispute (in wei)
    uint256 public disputeStake;

    /// @notice Voting window for dispute resolution
    uint256 public votingWindow;

    /// @notice Quorum required to resolve a dispute
    uint32 public quorum;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event DisputeRaised(
        uint256 indexed disputeId,
        DisputeType disputeType,
        address indexed raiser,
        address indexed target,
        uint256 targetTokenId,
        uint256 stake
    );

    event DisputeVoteCast(
        uint256 indexed disputeId,
        address indexed voter,
        uint32 voteCount,
        uint32 requiredQuorum
    );

    event DisputeUpheld(
        uint256 indexed disputeId,
        address indexed resolvedBy,
        string resolution
    );

    event DisputeDismissed(
        uint256 indexed disputeId,
        address indexed resolvedBy,
        string resolution
    );

    event StakeReturned(uint256 indexed disputeId, address indexed raiser, uint256 amount);
    event StakeSlashed(uint256 indexed disputeId, address indexed treasury, uint256 amount);

    event CouncilMemberAdded(address indexed member);
    event CouncilMemberRemoved(address indexed member);
    event DisputeStakeUpdated(uint256 oldStake, uint256 newStake);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    // =========================================================================
    // ERRORS
    // =========================================================================

    error Dispute__InsufficientStake(uint256 sent, uint256 required);
    error Dispute__NotFound(uint256 disputeId);
    error Dispute__NotOpen(uint256 disputeId, DisputeStatus status);
    error Dispute__Expired(uint256 disputeId);
    error Dispute__AlreadyVoted(address voter, uint256 disputeId);
    error Dispute__NotCouncilMember(address caller);
    error Dispute__ZeroAddress();
    error Dispute__QuorumNotReached(uint256 disputeId);
    error Dispute__TransferFailed();

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyCouncil() {
        _onlyCouncil();
        _;
    }

    function _onlyCouncil() internal view {
        if (!isCouncilMember[msg.sender]) {
            revert Dispute__NotCouncilMember(msg.sender);
        }
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(
        address initialOwner,
        address _credentialNft,
        address _workerIdentity,
        address _registry,
        address _treasury,
        uint256 _disputeStake,
        uint256 _votingWindow,
        uint32 _quorum
    ) Ownable(initialOwner) {
        if (
            _credentialNft == address(0)
            || _workerIdentity == address(0)
            || _registry == address(0)
            || _treasury == address(0)
        ) revert Dispute__ZeroAddress();

        CREDENTIAL_NFT = SoulboundCredential(_credentialNft);
        WORKER_IDENTITY = WorkerIdentity(_workerIdentity);
        REGISTRY = CredentialRegistry(_registry);
        treasury = _treasury;
        disputeStake = _disputeStake;
        votingWindow = _votingWindow;
        quorum = _quorum;
        _nextDisputeId = 1;
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    function addCouncilMember(address member) external onlyOwner {
        if (member == address(0)) revert Dispute__ZeroAddress();
        isCouncilMember[member] = true;
        emit CouncilMemberAdded(member);
    }

    function removeCouncilMember(address member) external onlyOwner {
        isCouncilMember[member] = false;
        emit CouncilMemberRemoved(member);
    }

    function setDisputeStake(uint256 newStake) external onlyOwner {
        emit DisputeStakeUpdated(disputeStake, newStake);
        disputeStake = newStake;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert Dispute__ZeroAddress();
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    // =========================================================================
    // RAISE DISPUTE
    // =========================================================================

    /// @notice Raise a credential fraud dispute
    /// @param tokenId The credential token ID being disputed
    /// @param evidence IPFS CID of the evidence document
    function raiseCredentialDispute(uint256 tokenId, string calldata evidence)
        external
        payable
        nonReentrant
        returns (uint256 disputeId)
    {
        if (msg.value < disputeStake) {
            revert Dispute__InsufficientStake(msg.value, disputeStake);
        }

        ICredential.Credential memory cred = CREDENTIAL_NFT.getCredential(tokenId);

        disputeId = _nextDisputeId;
        unchecked { _nextDisputeId++; }

        _disputes[disputeId] = Dispute({
            disputeId: disputeId,
            disputeType: DisputeType.CREDENTIAL_FRAUD,
            status: DisputeStatus.OPEN,
            raiser: msg.sender,
            target: cred.issuer,
            targetTokenId: tokenId,
            evidence: evidence,
            stake: msg.value,
            createdAt: uint48(block.timestamp),
            // forge-lint: disable-next-line(unsafe-typecast)
            expiresAt: uint48(block.timestamp + votingWindow),
            voteCount: 0,
            requiredQuorum: quorum,
            resolution: ""
        });

        emit DisputeRaised(
            disputeId,
            DisputeType.CREDENTIAL_FRAUD,
            msg.sender,
            cred.issuer,
            tokenId,
            msg.value
        );
    }

    /// @notice Raise an identity impersonation dispute
    /// @param wallet The worker wallet being disputed
    /// @param evidence IPFS CID of the evidence document
    function raiseIdentityDispute(address wallet, string calldata evidence)
        external
        payable
        nonReentrant
        returns (uint256 disputeId)
    {
        if (msg.value < disputeStake) {
            revert Dispute__InsufficientStake(msg.value, disputeStake);
        }
        if (wallet == address(0)) revert Dispute__ZeroAddress();

        disputeId = _nextDisputeId;
        unchecked { _nextDisputeId++; }

        _disputes[disputeId] = Dispute({
            disputeId: disputeId,
            disputeType: DisputeType.IDENTITY_IMPERSONATION,
            status: DisputeStatus.OPEN,
            raiser: msg.sender,
            target: wallet,
            targetTokenId: 0,
            evidence: evidence,
            stake: msg.value,
            createdAt: uint48(block.timestamp),
            // forge-lint: disable-next-line(unsafe-typecast)
            expiresAt: uint48(block.timestamp + votingWindow),
            voteCount: 0,
            requiredQuorum: quorum,
            resolution: ""
        });

        emit DisputeRaised(
            disputeId,
            DisputeType.IDENTITY_IMPERSONATION,
            msg.sender,
            wallet,
            0,
            msg.value
        );
    }

    // =========================================================================
    // VOTING
    // =========================================================================

    /// @notice Cast a vote on an open dispute
    function vote(uint256 disputeId) external onlyCouncil nonReentrant {
        Dispute storage dispute = _disputes[disputeId];

        if (dispute.disputeId == 0) revert Dispute__NotFound(disputeId);
        if (dispute.status != DisputeStatus.OPEN) {
            revert Dispute__NotOpen(disputeId, dispute.status);
        }
        if (block.timestamp > dispute.expiresAt) {
            dispute.status = DisputeStatus.EXPIRED;
            revert Dispute__Expired(disputeId);
        }
        if (hasVoted[disputeId][msg.sender]) {
            revert Dispute__AlreadyVoted(msg.sender, disputeId);
        }

        hasVoted[disputeId][msg.sender] = true;
        unchecked { dispute.voteCount++; }

        emit DisputeVoteCast(
            disputeId,
            msg.sender,
            dispute.voteCount,
            dispute.requiredQuorum
        );
    }

    // =========================================================================
    // RESOLUTION
    // =========================================================================

    /// @notice Uphold a dispute — execute remediation
    /// @dev Council only. Requires quorum to be reached first.
    function uphold(uint256 disputeId, string calldata resolution)
        external
        onlyCouncil
        nonReentrant
    {
        Dispute storage dispute = _disputes[disputeId];

        if (dispute.disputeId == 0) revert Dispute__NotFound(disputeId);
        if (dispute.status != DisputeStatus.OPEN) {
            revert Dispute__NotOpen(disputeId, dispute.status);
        }
        if (dispute.voteCount < dispute.requiredQuorum) {
            revert Dispute__QuorumNotReached(disputeId);
        }

        dispute.status = DisputeStatus.UPHELD;
        dispute.resolution = resolution;

        // Execute remediation based on dispute type
        if (dispute.disputeType == DisputeType.CREDENTIAL_FRAUD) {
            // Revoke the disputed credential
            try CREDENTIAL_NFT.revoke(dispute.targetTokenId, resolution) {}
            catch {}
        } else if (dispute.disputeType == DisputeType.IDENTITY_IMPERSONATION) {
            // Suspend the worker identity
            try WORKER_IDENTITY.setStatus(
                dispute.target,
                IWorkerIdentity.IdentityStatus.SUSPENDED
            ) {}
            catch {}
        } else if (dispute.disputeType == DisputeType.INSTITUTION_MISCONDUCT) {
            // Revoke the institution
            try REGISTRY.revokeInstitution(dispute.target, resolution) {}
            catch {}
        }

        // Slash stake to treasury — raiser raised a valid dispute but
        // stake covers the cost of council time
        uint256 stake = dispute.stake;
        dispute.stake = 0;

        (bool sent,) = treasury.call{value: stake}("");
        if (!sent) revert Dispute__TransferFailed();

        emit StakeSlashed(disputeId, treasury, stake);
        emit DisputeUpheld(disputeId, msg.sender, resolution);
    }

    /// @notice Dismiss a dispute — return stake to raiser
    function dismiss(uint256 disputeId, string calldata resolution)
        external
        onlyCouncil
        nonReentrant
    {
        Dispute storage dispute = _disputes[disputeId];

        if (dispute.disputeId == 0) revert Dispute__NotFound(disputeId);
        if (dispute.status != DisputeStatus.OPEN) {
            revert Dispute__NotOpen(disputeId, dispute.status);
        }

        dispute.status = DisputeStatus.DISMISSED;
        dispute.resolution = resolution;

        // Return stake to raiser
        uint256 stake = dispute.stake;
        dispute.stake = 0;

        (bool sent,) = dispute.raiser.call{value: stake}("");
        if (!sent) revert Dispute__TransferFailed();

        emit StakeReturned(disputeId, dispute.raiser, stake);
        emit DisputeDismissed(disputeId, msg.sender, resolution);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    function getDispute(uint256 disputeId)
        external
        view
        returns (Dispute memory)
    {
        return _disputes[disputeId];
    }

    function totalDisputes() external view returns (uint256) {
        return _nextDisputeId - 1;
    }
}