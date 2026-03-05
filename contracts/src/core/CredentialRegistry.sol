// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ICredential} from "../interfaces/ICredential.sol";
import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {SoulboundCredential} from "./SoulboundCredential.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CredentialRegistry
/// @author Afolabi Emmanuel
/// @notice Gatekeeper for all credential issuance in the VeraFlow protocol.
///         Maintains the whitelist of verified institutions (universities,
///         hospitals, governments) that are authorized to issue credentials.
///         All credential issuance flows through this contract — it is the
///         only address authorized to call SoulboundCredential.issue().
///
/// @dev Trust levels:
///         0 = UNVERIFIED  — not in registry
///         1 = PENDING     — applied, awaiting governance approval
///         2 = VERIFIED    — approved, can issue credentials
///         3 = PREMIUM     — top-tier institution, higher daily issuance limit
///
///      Governance (owner) approves/revokes institutions.
///      In production this owner will be the IssuerGovernance DAO contract.
contract CredentialRegistry is Ownable, Pausable, ReentrancyGuard {
    // =========================================================================
    // TYPES
    // =========================================================================

    /// @notice Trust level of a registered institution
    enum TrustLevel {
        UNVERIFIED, // 0 — default, not registered
        PENDING,    // 1 — applied, awaiting approval
        VERIFIED,   // 2 — approved institution
        PREMIUM     // 3 — top-tier institution
    }

    /// @notice Full institution record
    struct Institution {
        address wallet;
        string name;
        string country;
        TrustLevel trustLevel;
        uint48 registeredAt;
        uint48 approvedAt;
        uint256 totalIssued;
        uint256 dailyIssued;
        uint48 dailyResetAt;
        bool active;
    }

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    uint256 public constant VERIFIED_DAILY_LIMIT = 500;
    uint256 public constant PREMIUM_DAILY_LIMIT = 5_000;
    uint256 private constant SECONDS_PER_DAY = 86_400;

    // =========================================================================
    // STATE
    // =========================================================================

    /// @notice The SoulboundCredential NFT contract
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    SoulboundCredential public immutable CREDENTIAL_NFT;

    /// @notice The WorkerIdentity contract — checked before issuance
    IWorkerIdentity public workerIdentity;

    /// @notice institution wallet => Institution record
    mapping(address => Institution) private _institutions;

    /// @notice All registered institution addresses for enumeration
    address[] private _institutionList;

    /// @notice institution wallet => index in _institutionList
    mapping(address => uint256) private _institutionIndex;

    // =========================================================================
    // EVENTS
    // =========================================================================

    event InstitutionApplied(
        address indexed wallet,
        string name,
        string country,
        uint48 appliedAt
    );

    event InstitutionApproved(
        address indexed wallet,
        TrustLevel trustLevel,
        uint48 approvedAt
    );

    event InstitutionRevoked(
        address indexed wallet,
        address revokedBy,
        string reason
    );

    event InstitutionTrustLevelUpdated(
        address indexed wallet,
        TrustLevel oldLevel,
        TrustLevel newLevel
    );

    event CredentialIssued(
        address indexed institution,
        address indexed holder,
        uint256 indexed tokenId,
        ICredential.CredentialType credentialType
    );

    event WorkerIdentityContractUpdated(
        address oldContract,
        address newContract
    );

    // =========================================================================
    // ERRORS
    // =========================================================================

    error Registry__AlreadyRegistered(address wallet);
    error Registry__NotRegistered(address wallet);
    error Registry__NotApproved(address wallet, TrustLevel current);
    error Registry__InstitutionInactive(address wallet);
    error Registry__DailyLimitExceeded(address wallet, uint256 limit);
    error Registry__ZeroAddress();
    error Registry__EmptyString(string field);
    error Registry__WorkerNotActive(address worker);
    error Registry__InvalidTrustLevel(TrustLevel level);

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    /// @param initialOwner Protocol multisig — will be transferred to DAO
    /// @param _credentialNft The deployed SoulboundCredential contract
    constructor(address initialOwner, address _credentialNft)
        Ownable(initialOwner)
    {
        if (_credentialNft == address(0)) revert Registry__ZeroAddress();
        CREDENTIAL_NFT = SoulboundCredential(_credentialNft);
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    /// @notice Set the WorkerIdentity contract address
    function setWorkerIdentity(address _workerIdentity) external onlyOwner {
        if (_workerIdentity == address(0)) revert Registry__ZeroAddress();
        emit WorkerIdentityContractUpdated(address(workerIdentity), _workerIdentity);
        workerIdentity = IWorkerIdentity(_workerIdentity);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // =========================================================================
    // INSTITUTION REGISTRATION
    // =========================================================================

    /// @notice An institution applies to join the registry
    /// @dev Sets trust level to PENDING — governance must approve
    /// @param name Full institution name
    /// @param country ISO 3166-1 alpha-2 country code
    function applyForRegistry(string calldata name, string calldata country)
        external
        whenNotPaused
    {
        if (msg.sender == address(0)) revert Registry__ZeroAddress();
        if (_institutions[msg.sender].registeredAt != 0) {
            revert Registry__AlreadyRegistered(msg.sender);
        }
        if (bytes(name).length == 0) revert Registry__EmptyString("name");
        if (bytes(country).length == 0) revert Registry__EmptyString("country");

        _institutionIndex[msg.sender] = _institutionList.length;
        _institutionList.push(msg.sender);

        _institutions[msg.sender] = Institution({
            wallet: msg.sender,
            name: name,
            country: country,
            trustLevel: TrustLevel.PENDING,
            registeredAt: uint48(block.timestamp),
            approvedAt: 0,
            totalIssued: 0,
            dailyIssued: 0,
            dailyResetAt: 0,
            active: false
        });

        emit InstitutionApplied(msg.sender, name, country, uint48(block.timestamp));
    }

    // =========================================================================
    // GOVERNANCE
    // =========================================================================

    /// @notice Approve a pending institution
    /// @param wallet The institution to approve
    /// @param trustLevel Must be VERIFIED or PREMIUM
    function approveInstitution(address wallet, TrustLevel trustLevel)
        external
        onlyOwner
    {
        if (wallet == address(0)) revert Registry__ZeroAddress();
        if (_institutions[wallet].registeredAt == 0) {
            revert Registry__NotRegistered(wallet);
        }
        if (trustLevel != TrustLevel.VERIFIED && trustLevel != TrustLevel.PREMIUM) {
            revert Registry__InvalidTrustLevel(trustLevel);
        }

        Institution storage inst = _institutions[wallet];
        inst.trustLevel = trustLevel;
        inst.approvedAt = uint48(block.timestamp);
        inst.active = true;

        emit InstitutionApproved(wallet, trustLevel, uint48(block.timestamp));
    }

    /// @notice Update an institution's trust level
    function updateTrustLevel(address wallet, TrustLevel newLevel)
        external
        onlyOwner
    {
        Institution storage inst = _institutions[wallet];
        if (inst.registeredAt == 0) revert Registry__NotRegistered(wallet);
        if (newLevel == TrustLevel.UNVERIFIED || newLevel == TrustLevel.PENDING) {
            revert Registry__InvalidTrustLevel(newLevel);
        }

        TrustLevel old = inst.trustLevel;
        inst.trustLevel = newLevel;

        emit InstitutionTrustLevelUpdated(wallet, old, newLevel);
    }

    /// @notice Revoke an institution — disables issuance immediately
    function revokeInstitution(address wallet, string calldata reason)
        external
        onlyOwner
    {
        Institution storage inst = _institutions[wallet];
        if (inst.registeredAt == 0) revert Registry__NotRegistered(wallet);

        inst.active = false;
        inst.trustLevel = TrustLevel.UNVERIFIED;

        emit InstitutionRevoked(wallet, msg.sender, reason);
    }

    // =========================================================================
    // CORE — CREDENTIAL ISSUANCE
    // =========================================================================

    /// @notice Issue a credential to a worker
    /// @param holder The worker's wallet address
    /// @param credentialType The type of credential
    /// @param burnAuth Who can burn this token
    /// @param expiresAt Expiry timestamp (0 = never)
    /// @param metadataHash keccak256 of IPFS metadata
    /// @return tokenId The newly issued credential token ID
    function issueCredential(
        address holder,
        ICredential.CredentialType credentialType,
        ICredential.BurnAuth burnAuth,
        uint48 expiresAt,
        bytes32 metadataHash
    )
        external
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        Institution storage inst = _institutions[msg.sender];
        if (inst.registeredAt == 0) revert Registry__NotRegistered(msg.sender);
        if (!inst.active) revert Registry__InstitutionInactive(msg.sender);
        if (inst.trustLevel < TrustLevel.VERIFIED) {
            revert Registry__NotApproved(msg.sender, inst.trustLevel);
        }

        if (address(workerIdentity) != address(0)) {
            if (!workerIdentity.isActive(holder)) {
                revert Registry__WorkerNotActive(holder);
            }
        }

        _checkAndResetDailyLimit(inst);

        uint256 limit = inst.trustLevel == TrustLevel.PREMIUM
            ? PREMIUM_DAILY_LIMIT
            : VERIFIED_DAILY_LIMIT;

        if (inst.dailyIssued >= limit) {
            revert Registry__DailyLimitExceeded(msg.sender, limit);
        }

        unchecked {
            inst.totalIssued++;
            inst.dailyIssued++;
        }

        tokenId = CREDENTIAL_NFT.issue(
            msg.sender,
            holder,
            credentialType,
            burnAuth,
            expiresAt,
            metadataHash
        );

        if (address(workerIdentity) != address(0)) {
            workerIdentity.incrementCredentialCount(holder);
        }

        emit CredentialIssued(msg.sender, holder, tokenId, credentialType);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @notice Get full institution data
    function getInstitution(address wallet)
        external
        view
        returns (Institution memory)
    {
        return _institutions[wallet];
    }

    /// @notice Check if an institution is approved and active
    function isApproved(address wallet) external view returns (bool) {
        Institution storage inst = _institutions[wallet];
        return inst.active && inst.trustLevel >= TrustLevel.VERIFIED;
    }

    /// @notice Get total number of registered institutions
    function totalInstitutions() external view returns (uint256) {
        return _institutionList.length;
    }

    /// @notice Paginated institution list — avoids unbounded loops
    /// @param offset Start index
    /// @param limit Max results to return
    function getInstitutions(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        uint256 total = _institutionList.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;

        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end;) {
            result[i - offset] = _institutionList[i];
            unchecked { i++; }
        }
        return result;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    /// @dev Reset daily counter if a new UTC day has started
    ///      Uses modulo subtraction — avoids divide-before-multiply precision loss
    function _checkAndResetDailyLimit(Institution storage inst) internal {
        // forge-lint: disable-next-line(unsafe-typecast)
        uint48 dayStart = uint48(block.timestamp - (block.timestamp % SECONDS_PER_DAY));
        if (inst.dailyResetAt < dayStart) {
            inst.dailyIssued = 0;
            inst.dailyResetAt = dayStart;
        }
    }
}