// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {CredentialRegistry} from "../core/CredentialRegistry.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title IssuerGovernance
/// @author Afolabi Emmanuel
/// @notice On-chain governance for managing institution approvals in VeraFlow.
///         Council members vote to approve or reject institution applications.
///         Designed as a lightweight multisig-style council — not token voting.
///         In production, council seats are held by trusted community members,
///         academic bodies, and regional representatives.
///
/// @dev Governance model:
///      - Council has N members (initialized at deploy, managed by owner)
///      - Each proposal requires a quorum of votes to pass
///      - Proposals have a voting window — expire if not executed in time
///      - Passed proposals are executed by anyone (permissionless execution)
///      - Owner (protocol multisig) can add/remove council members
///      - Owner can set quorum and voting window parameters
///
///      Proposal types:
///        APPROVE_INSTITUTION  — approve a pending institution with a trust level
///        REVOKE_INSTITUTION   — revoke an approved institution
///        UPDATE_TRUST_LEVEL   — change an institution's trust level
contract IssuerGovernance is Ownable, ReentrancyGuard {
    // =========================================================================
    // TYPES
    // =========================================================================

    enum ProposalType {
        APPROVE_INSTITUTION,
        REVOKE_INSTITUTION,
        UPDATE_TRUST_LEVEL
    }

    enum ProposalStatus {
        PENDING,    // Voting open
        PASSED,     // Quorum reached, awaiting execution
        EXECUTED,   // Successfully executed on CredentialRegistry
        REJECTED,   // Voting window expired without quorum
        CANCELLED   // Cancelled by owner
    }

    struct Proposal {
        uint256 proposalId;
        ProposalType proposalType;
        ProposalStatus status;
        address targetInstitution;
        CredentialRegistry.TrustLevel trustLevel; // Used for APPROVE and UPDATE
        string reason;
        address proposedBy;
        uint48 createdAt;
        uint48 expiresAt;
        uint32 voteCount;
        uint32 requiredQuorum;
    }

    // =========================================================================
    // STATE
    // =========================================================================

    CredentialRegistry public immutable REGISTRY;

    /// @notice Council member addresses
    mapping(address => bool) public isCouncilMember;
    address[] private _councilMembers;

    /// @notice proposalId => Proposal
    mapping(uint256 => Proposal) private _proposals;

    /// @notice proposalId => council member => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256 private _nextProposalId;

    /// @notice Minimum votes needed to pass a proposal
    uint32 public quorum;

    /// @notice How long a proposal stays open for voting (seconds)
    uint256 public votingWindow;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        address indexed targetInstitution,
        address proposedBy,
        uint48 expiresAt
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint32 voteCount,
        uint32 requiredQuorum
    );

    event ProposalExecuted(
        uint256 indexed proposalId,
        ProposalType proposalType,
        address indexed targetInstitution,
        address executedBy
    );

    event ProposalRejected(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId, address cancelledBy);

    event CouncilMemberAdded(address indexed member);
    event CouncilMemberRemoved(address indexed member);
    event QuorumUpdated(uint32 oldQuorum, uint32 newQuorum);
    event VotingWindowUpdated(uint256 oldWindow, uint256 newWindow);

    // =========================================================================
    // ERRORS
    // =========================================================================

    error Governance__NotCouncilMember(address caller);
    error Governance__AlreadyVoted(address voter, uint256 proposalId);
    error Governance__ProposalExpired(uint256 proposalId);
    error Governance__ProposalNotPassed(uint256 proposalId, ProposalStatus status);
    error Governance__ProposalNotFound(uint256 proposalId);
    error Governance__ZeroAddress();
    error Governance__AlreadyCouncilMember(address member);
    error Governance__NotCouncilMemberToRemove(address member);
    error Governance__QuorumExceedsCouncil(uint32 quorum, uint256 councilSize);
    error Governance__InvalidQuorum();

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyCouncil() {
        _onlyCouncil();
        _;
    }

    function _onlyCouncil() internal view {
        if (!isCouncilMember[msg.sender]) {
            revert Governance__NotCouncilMember(msg.sender);
        }
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /// @param initialOwner Protocol multisig
    /// @param _registry The CredentialRegistry this governance controls
    /// @param initialCouncil Initial council member addresses
    /// @param _quorum Initial quorum requirement
    /// @param _votingWindow Initial voting window in seconds
    constructor(
        address initialOwner,
        address _registry,
        address[] memory initialCouncil,
        uint32 _quorum,
        uint256 _votingWindow
    ) Ownable(initialOwner) {
        if (_registry == address(0)) revert Governance__ZeroAddress();
        if (_quorum == 0) revert Governance__InvalidQuorum();
        if (_quorum > initialCouncil.length) {
            revert Governance__QuorumExceedsCouncil(_quorum, initialCouncil.length);
        }

        REGISTRY = CredentialRegistry(_registry);
        quorum = _quorum;
        votingWindow = _votingWindow;
        _nextProposalId = 1;

        for (uint256 i = 0; i < initialCouncil.length;) {
            address member = initialCouncil[i];
            if (member == address(0)) revert Governance__ZeroAddress();
            isCouncilMember[member] = true;
            _councilMembers.push(member);
            emit CouncilMemberAdded(member);
            unchecked { i++; }
        }
    }

    // =========================================================================
    // COUNCIL MANAGEMENT
    // =========================================================================

    function addCouncilMember(address member) external onlyOwner {
        if (member == address(0)) revert Governance__ZeroAddress();
        if (isCouncilMember[member]) {
            revert Governance__AlreadyCouncilMember(member);
        }
        isCouncilMember[member] = true;
        _councilMembers.push(member);
        emit CouncilMemberAdded(member);
    }

    function removeCouncilMember(address member) external onlyOwner {
        if (!isCouncilMember[member]) {
            revert Governance__NotCouncilMemberToRemove(member);
        }
        if (quorum > _councilMembers.length - 1) {
            revert Governance__QuorumExceedsCouncil(quorum, _councilMembers.length - 1);
        }

        isCouncilMember[member] = false;

        // Swap-and-pop removal
        for (uint256 i = 0; i < _councilMembers.length;) {
            if (_councilMembers[i] == member) {
                _councilMembers[i] = _councilMembers[_councilMembers.length - 1];
                _councilMembers.pop();
                break;
            }
            unchecked { i++; }
        }

        emit CouncilMemberRemoved(member);
    }

    function setQuorum(uint32 newQuorum) external onlyOwner {
        if (newQuorum == 0) revert Governance__InvalidQuorum();
        if (newQuorum > _councilMembers.length) {
            revert Governance__QuorumExceedsCouncil(newQuorum, _councilMembers.length);
        }
        emit QuorumUpdated(quorum, newQuorum);
        quorum = newQuorum;
    }

    function setVotingWindow(uint256 newWindow) external onlyOwner {
        emit VotingWindowUpdated(votingWindow, newWindow);
        votingWindow = newWindow;
    }

    // =========================================================================
    // PROPOSALS
    // =========================================================================

    /// @notice Create a proposal to approve a pending institution
    function proposeApprove(
        address institution,
        CredentialRegistry.TrustLevel trustLevel,
        string calldata reason
    )
        external
        onlyCouncil
        returns (uint256 proposalId)
    {
        return _createProposal(
            ProposalType.APPROVE_INSTITUTION,
            institution,
            trustLevel,
            reason
        );
    }

    /// @notice Create a proposal to revoke an institution
    function proposeRevoke(address institution, string calldata reason)
        external
        onlyCouncil
        returns (uint256 proposalId)
    {
        return _createProposal(
            ProposalType.REVOKE_INSTITUTION,
            institution,
            CredentialRegistry.TrustLevel.UNVERIFIED,
            reason
        );
    }

    /// @notice Create a proposal to update an institution's trust level
    function proposeUpdateTrustLevel(
        address institution,
        CredentialRegistry.TrustLevel newLevel,
        string calldata reason
    )
        external
        onlyCouncil
        returns (uint256 proposalId)
    {
        return _createProposal(
            ProposalType.UPDATE_TRUST_LEVEL,
            institution,
            newLevel,
            reason
        );
    }

    // =========================================================================
    // VOTING
    // =========================================================================

    /// @notice Cast a vote in favor of a proposal
    /// @dev Council members can only vote once per proposal
    ///      No against votes — abstain by not voting
    function vote(uint256 proposalId) external onlyCouncil nonReentrant {
        Proposal storage proposal = _proposals[proposalId];

        if (proposal.proposalId == 0) {
            revert Governance__ProposalNotFound(proposalId);
        }
        if (proposal.status != ProposalStatus.PENDING) {
            revert Governance__ProposalNotPassed(proposalId, proposal.status);
        }
        if (block.timestamp > proposal.expiresAt) {
            // Auto-reject expired proposals on interaction
            proposal.status = ProposalStatus.REJECTED;
            emit ProposalRejected(proposalId);
            return;
        }
        if (hasVoted[proposalId][msg.sender]) {
            revert Governance__AlreadyVoted(msg.sender, proposalId);
        }

        hasVoted[proposalId][msg.sender] = true;
        unchecked { proposal.voteCount++; }

        emit VoteCast(proposalId, msg.sender, proposal.voteCount, proposal.requiredQuorum);

        // Auto-transition to PASSED when quorum is reached
        if (proposal.voteCount >= proposal.requiredQuorum) {
            proposal.status = ProposalStatus.PASSED;
        }
    }

    // =========================================================================
    // EXECUTION
    // =========================================================================

    /// @notice Execute a passed proposal — permissionless
    /// @dev Anyone can execute once quorum is reached
    function execute(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = _proposals[proposalId];

        if (proposal.proposalId == 0) {
            revert Governance__ProposalNotFound(proposalId);
        }
        if (proposal.status != ProposalStatus.PASSED) {
            revert Governance__ProposalNotPassed(proposalId, proposal.status);
        }

        proposal.status = ProposalStatus.EXECUTED;

        if (proposal.proposalType == ProposalType.APPROVE_INSTITUTION) {
            REGISTRY.approveInstitution(
                proposal.targetInstitution,
                proposal.trustLevel
            );
        } else if (proposal.proposalType == ProposalType.REVOKE_INSTITUTION) {
            REGISTRY.revokeInstitution(
                proposal.targetInstitution,
                proposal.reason
            );
        } else if (proposal.proposalType == ProposalType.UPDATE_TRUST_LEVEL) {
            REGISTRY.updateTrustLevel(
                proposal.targetInstitution,
                proposal.trustLevel
            );
        }

        emit ProposalExecuted(
            proposalId,
            proposal.proposalType,
            proposal.targetInstitution,
            msg.sender
        );
    }

    /// @notice Cancel a proposal — owner only
    function cancel(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = _proposals[proposalId];
        if (proposal.proposalId == 0) {
            revert Governance__ProposalNotFound(proposalId);
        }
        proposal.status = ProposalStatus.CANCELLED;
        emit ProposalCancelled(proposalId, msg.sender);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    function getProposal(uint256 proposalId)
        external
        view
        returns (Proposal memory)
    {
        return _proposals[proposalId];
    }

    function councilSize() external view returns (uint256) {
        return _councilMembers.length;
    }

    function getCouncilMembers() external view returns (address[] memory) {
        return _councilMembers;
    }

    function totalProposals() external view returns (uint256) {
        return _nextProposalId - 1;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    function _createProposal(
        ProposalType proposalType,
        address institution,
        CredentialRegistry.TrustLevel trustLevel,
        string calldata reason
    )
        internal
        returns (uint256 proposalId)
    {
        if (institution == address(0)) revert Governance__ZeroAddress();

        proposalId = _nextProposalId;
        unchecked { _nextProposalId++; }

        _proposals[proposalId] = Proposal({
            proposalId: proposalId,
            proposalType: proposalType,
            status: ProposalStatus.PENDING,
            targetInstitution: institution,
            trustLevel: trustLevel,
            reason: reason,
            proposedBy: msg.sender,
            createdAt: uint48(block.timestamp),
            // forge-lint: disable-next-line(unsafe-typecast)
            expiresAt: uint48(block.timestamp + votingWindow), // safe: votingWindow is governance-controlled and bounded
            voteCount: 0,
            requiredQuorum: quorum
        });

        emit ProposalCreated(
            proposalId,
            proposalType,
            institution,
            msg.sender,
            // forge-lint: disable-next-line(unsafe-typecast)
            uint48(block.timestamp + votingWindow) // safe: votingWindow is governance-controlled and bounded
        );
    }
}