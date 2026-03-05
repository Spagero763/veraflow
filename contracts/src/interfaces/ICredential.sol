// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ICredential
/// @notice ERC-5484 compliant soulbound credential interface for VeraFlow
interface ICredential {
    enum CredentialType {
        DEGREE,
        CERTIFICATION,
        LICENSE,
        EMPLOYMENT,
        SKILL,
        IDENTITY
    }

    enum BurnAuth {
        IssuerOnly,
        OwnerOnly,
        Both,
        Neither
    }

    struct Credential {
        uint256 tokenId;
        address issuer;
        address holder;
        CredentialType credentialType;
        BurnAuth burnAuth;
        uint48 issuedAt;
        uint48 expiresAt;
        bytes32 metadataHash;
        bool revoked;
    }

    event Issued(uint256 indexed tokenId, address indexed issuer, address indexed holder, BurnAuth burnAuth);
    event CredentialRevoked(uint256 indexed tokenId, address indexed issuer, address indexed holder, string reason);
    event MetadataUpdated(uint256 indexed tokenId, bytes32 oldHash, bytes32 newHash);

    error Credential__NotFound(uint256 tokenId);
    error Credential__AlreadyRevoked(uint256 tokenId);
    error Credential__Expired(uint256 tokenId, uint48 expiresAt);
    error Credential__NotTransferable();
    error Credential__InvalidIssuer(address caller);
    error Credential__InvalidHolder(address holder);
    error Credential__InvalidMetadataHash();
    error Credential__ExpiryBeforeIssuance();
    error Credential__UnauthorizedBurn(address caller, uint256 tokenId);

    function issue(address issuer, address holder, CredentialType credentialType, BurnAuth burnAuth, uint48 expiresAt, bytes32 metadataHash) external returns (uint256 tokenId);
    function revoke(uint256 tokenId, string calldata reason) external;
    function isValid(uint256 tokenId) external view returns (bool);
    function getCredential(uint256 tokenId) external view returns (Credential memory);
    function getCredentialsByHolder(address holder) external view returns (uint256[] memory);
    function getCredentialsByIssuer(address issuer) external view returns (uint256[] memory);
    function burnAuth(uint256 tokenId) external view returns (BurnAuth);
}
