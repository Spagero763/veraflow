// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IWorkerIdentity} from "../interfaces/IWorkerIdentity.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title WorkerIdentity
/// @author Afolabi Emmanuel
/// @notice On-chain DID registry and identity layer for VeraFlow workers.
///         Every worker registers once — creating a permanent, self-sovereign
///         identity that anchors their credentials, reputation, and loans.
///
/// @dev Design decisions:
///      - 1 address : 1 identity — enforced at registration
///      - DID format: did:veraflow:<chainId>:<address>
///        stored as keccak256 hash on-chain, full string resolved off-chain
///      - Reputation score is written exclusively by the ReputationScore
///        contract — no manual overrides possible
///      - Credential count is written exclusively by CredentialRegistry
///      - Status changes (suspend/reinstate) are governance-only
///      - Workers own and control their profile metadata (IPFS hash)
///      - Deactivation is irreversible — prevents identity recycling attacks
contract WorkerIdentity is IWorkerIdentity, Ownable, Pausable, ReentrancyGuard {
    // =========================================================================
    // STATE
    // =========================================================================

    mapping(address => Identity) private _identities;
    mapping(bytes32 => address) private _didToWallet;

    address public reputationScoreContract;
    address public credentialRegistryContract;

    uint256 private _totalRegistered;

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyReputationEngine() {
        _onlyReputationEngine();
        _;
    }

    modifier onlyCredentialRegistry() {
        _onlyCredentialRegistry();
        _;
    }

    modifier onlyActiveIdentity(address wallet) {
        _onlyActiveIdentity(wallet);
        _;
    }

    function _onlyReputationEngine() internal view {
        if (msg.sender != reputationScoreContract) {
            revert WorkerIdentity__InvalidScoreEngine(msg.sender);
        }
    }

    function _onlyCredentialRegistry() internal view {
        if (msg.sender != credentialRegistryContract) {
            revert WorkerIdentity__Unauthorized(msg.sender);
        }
    }

    function _onlyActiveIdentity(address wallet) internal view {
        Identity storage id = _identities[wallet];
        if (id.status != IdentityStatus.ACTIVE) {
            revert WorkerIdentity__NotActive(wallet, id.status);
        }
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(address initialOwner) Ownable(initialOwner) {}

    // =========================================================================
    // ADMIN
    // =========================================================================

    function setReputationScoreContract(address _contract) external onlyOwner {
        if (_contract == address(0)) revert WorkerIdentity__ZeroAddress();
        reputationScoreContract = _contract;
    }

    function setCredentialRegistryContract(address _contract) external onlyOwner {
        if (_contract == address(0)) revert WorkerIdentity__ZeroAddress();
        credentialRegistryContract = _contract;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    /// @inheritdoc IWorkerIdentity
    function register(bytes32 profileMetaHash)
        external
        override
        whenNotPaused
        nonReentrant
    {
        if (msg.sender == address(0)) revert WorkerIdentity__ZeroAddress();
        if (profileMetaHash == bytes32(0)) {
            revert WorkerIdentity__InvalidMetadataHash();
        }
        if (_identities[msg.sender].registeredAt != 0) {
            revert WorkerIdentity__AlreadyRegistered(msg.sender);
        }

        bytes32 didHash = _computeDidHash(msg.sender);

        if (_didToWallet[didHash] != address(0)) {
            revert WorkerIdentity__AlreadyRegistered(msg.sender);
        }

        _identities[msg.sender] = Identity({
            wallet: msg.sender,
            didHash: didHash,
            profileMetaHash: profileMetaHash,
            status: IdentityStatus.ACTIVE,
            registeredAt: uint48(block.timestamp),
            lastUpdatedAt: uint48(block.timestamp),
            credentialCount: 0,
            reputationScore: 0
        });

        _didToWallet[didHash] = msg.sender;

        unchecked { _totalRegistered++; }

        emit IdentityRegistered(msg.sender, didHash, uint48(block.timestamp));
    }

    /// @inheritdoc IWorkerIdentity
    function updateProfile(bytes32 newMetaHash)
        external
        override
        whenNotPaused
        nonReentrant
        onlyActiveIdentity(msg.sender)
    {
        if (newMetaHash == bytes32(0)) revert WorkerIdentity__InvalidMetadataHash();

        Identity storage id = _identities[msg.sender];
        bytes32 old = id.profileMetaHash;

        id.profileMetaHash = newMetaHash;
        id.lastUpdatedAt = uint48(block.timestamp);

        emit ProfileUpdated(msg.sender, old, newMetaHash);
    }

    /// @inheritdoc IWorkerIdentity
    function deactivate()
        external
        override
        nonReentrant
        onlyActiveIdentity(msg.sender)
    {
        Identity storage id = _identities[msg.sender];

        id.status = IdentityStatus.DEACTIVATED;
        id.lastUpdatedAt = uint48(block.timestamp);

        emit StatusChanged(
            msg.sender,
            IdentityStatus.ACTIVE,
            IdentityStatus.DEACTIVATED,
            msg.sender
        );
    }

    // =========================================================================
    // PRIVILEGED WRITES
    // =========================================================================

    /// @inheritdoc IWorkerIdentity
    function incrementCredentialCount(address wallet)
        external
        override
        onlyCredentialRegistry
    {
        if (_identities[wallet].registeredAt == 0) {
            revert WorkerIdentity__NotRegistered(wallet);
        }

        unchecked { _identities[wallet].credentialCount++; }

        emit CredentialCountIncremented(
            wallet,
            _identities[wallet].credentialCount
        );
    }

    /// @inheritdoc IWorkerIdentity
    function writeReputationScore(address wallet, uint32 newScore)
        external
        override
        onlyReputationEngine
    {
        if (_identities[wallet].registeredAt == 0) {
            revert WorkerIdentity__NotRegistered(wallet);
        }

        uint32 old = _identities[wallet].reputationScore;
        _identities[wallet].reputationScore = newScore;
        _identities[wallet].lastUpdatedAt = uint48(block.timestamp);

        emit ReputationScoreUpdated(wallet, old, newScore);
    }

    /// @inheritdoc IWorkerIdentity
    function setStatus(address wallet, IdentityStatus newStatus)
        external
        override
        onlyOwner
    {
        if (wallet == address(0)) revert WorkerIdentity__ZeroAddress();
        if (_identities[wallet].registeredAt == 0) {
            revert WorkerIdentity__NotRegistered(wallet);
        }
        if (newStatus == IdentityStatus.UNREGISTERED) {
            revert WorkerIdentity__InvalidStatus(newStatus);
        }
        if (newStatus == IdentityStatus.DEACTIVATED) {
            revert WorkerIdentity__InvalidStatus(newStatus);
        }

        IdentityStatus old = _identities[wallet].status;
        _identities[wallet].status = newStatus;
        _identities[wallet].lastUpdatedAt = uint48(block.timestamp);

        emit StatusChanged(wallet, old, newStatus, msg.sender);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @inheritdoc IWorkerIdentity
    function getIdentity(address wallet)
        external
        view
        override
        returns (Identity memory)
    {
        if (_identities[wallet].registeredAt == 0) {
            revert WorkerIdentity__NotRegistered(wallet);
        }
        return _identities[wallet];
    }

    /// @inheritdoc IWorkerIdentity
    function isActive(address wallet) external view override returns (bool) {
        return _identities[wallet].status == IdentityStatus.ACTIVE;
    }

    /// @inheritdoc IWorkerIdentity
    function resolveByDid(bytes32 didHash)
        external
        view
        override
        returns (address)
    {
        address wallet = _didToWallet[didHash];
        if (wallet == address(0)) revert WorkerIdentity__NotRegistered(address(0));
        return wallet;
    }

    /// @inheritdoc IWorkerIdentity
    function getReputationScore(address wallet)
        external
        view
        override
        returns (uint32)
    {
        return _identities[wallet].reputationScore;
    }

    /// @inheritdoc IWorkerIdentity
    function getDidHash(address wallet)
        external
        view
        override
        returns (bytes32)
    {
        if (_identities[wallet].registeredAt == 0) {
            revert WorkerIdentity__NotRegistered(wallet);
        }
        return _identities[wallet].didHash;
    }

    /// @notice Total number of registered identities
    function totalRegistered() external view returns (uint256) {
        return _totalRegistered;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    function _computeDidHash(address wallet) internal view returns (bytes32 result) {
        // forge-lint: disable-next-line(asm-keccak256)
        bytes memory encoded = abi.encodePacked(
            "did:veraflow:",
            block.chainid,
            ":",
            wallet
        );
        assembly {
            result := keccak256(add(encoded, 32), mload(encoded))
        }
    }
}