// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IWorkerIdentity {
    enum IdentityStatus {
        UNREGISTERED,
        ACTIVE,
        SUSPENDED,
        DEACTIVATED
    }

    struct Identity {
        address wallet;
        bytes32 didHash;
        bytes32 profileMetaHash;
        IdentityStatus status;
        uint48 registeredAt;
        uint48 lastUpdatedAt;
        uint32 credentialCount;
        uint32 reputationScore;
    }

    event IdentityRegistered(address indexed wallet, bytes32 indexed didHash, uint48 registeredAt);
    event ProfileUpdated(address indexed wallet, bytes32 oldMetaHash, bytes32 newMetaHash);
    event StatusChanged(address indexed wallet, IdentityStatus oldStatus, IdentityStatus newStatus, address changedBy);
    event ReputationScoreUpdated(address indexed wallet, uint32 oldScore, uint32 newScore);
    event CredentialCountIncremented(address indexed wallet, uint32 newCount);

    error WorkerIdentity__AlreadyRegistered(address wallet);
    error WorkerIdentity__NotRegistered(address wallet);
    error WorkerIdentity__NotActive(address wallet, IdentityStatus status);
    error WorkerIdentity__ZeroAddress();
    error WorkerIdentity__InvalidMetadataHash();
    error WorkerIdentity__Unauthorized(address caller);
    error WorkerIdentity__InvalidScoreEngine(address caller);
    error WorkerIdentity__InvalidStatus(IdentityStatus status);

    function register(bytes32 profileMetaHash) external;
    function updateProfile(bytes32 newMetaHash) external;
    function deactivate() external;

    function incrementCredentialCount(address wallet) external;
    function writeReputationScore(address wallet, uint32 newScore) external;
    function setStatus(address wallet, IdentityStatus newStatus) external;

    function getIdentity(address wallet) external view returns (Identity memory);
    function isActive(address wallet) external view returns (bool);
    function resolveByDid(bytes32 didHash) external view returns (address);
    function getReputationScore(address wallet) external view returns (uint32);
    function getDidHash(address wallet) external view returns (bytes32);
}
