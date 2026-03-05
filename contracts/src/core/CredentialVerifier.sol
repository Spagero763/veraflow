// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ICredential} from "../interfaces/ICredential.sol";
import {SoulboundCredential} from "./SoulboundCredential.sol";
import {CredentialRegistry} from "./CredentialRegistry.sol";

/// @title CredentialVerifier
/// @author Afolabi Emmanuel
/// @notice Stateless, read-only contract for credential verification.
///         This is the public-facing verification layer — employers, third
///         parties, and external protocols call this contract to verify
///         worker credentials without needing to understand the internals
///         of SoulboundCredential or CredentialRegistry.
///
/// @dev Intentionally stateless — no storage, no admin, no owner.
///      All data is read from SoulboundCredential and CredentialRegistry.
///      This contract can be redeployed without affecting any state.
///      Designed to be called freely by anyone — zero access control.
contract CredentialVerifier {
    // =========================================================================
    // IMMUTABLES
    // =========================================================================

    SoulboundCredential public immutable CREDENTIAL_NFT;
    CredentialRegistry public immutable REGISTRY;

    // =========================================================================
    // TYPES
    // =========================================================================

    /// @notice Aggregated verification result for a single credential
    struct VerificationResult {
        bool isValid;                           // Overall validity
        bool exists;                            // Token exists on-chain
        bool revoked;                           // Revoked by issuer
        bool expired;                           // Past expiry timestamp
        bool issuerTrusted;                     // Issuer is approved in registry
        ICredential.CredentialType credType;    // Type of credential
        address issuer;                         // Issuing institution
        address holder;                         // Credential holder
        uint48 issuedAt;                        // Issuance timestamp
        uint48 expiresAt;                       // Expiry (0 = never)
        bytes32 metadataHash;                   // IPFS metadata hash
    }

    /// @notice Batch verification summary for a worker's full credential portfolio
    struct PortfolioSummary {
        address holder;
        uint256 totalCredentials;
        uint256 validCredentials;
        uint256 revokedCredentials;
        uint256 expiredCredentials;
        bool hasDegree;
        bool hasLicense;
        bool hasCertification;
        bool hasEmploymentRecord;
    }

    // =========================================================================
    // ERRORS
    // =========================================================================

    error Verifier__ZeroAddress();
    error Verifier__EmptyTokenIdArray();
    error Verifier__BatchLimitExceeded(uint256 requested, uint256 maximum);

    // =========================================================================
    // CONSTANTS
    // =========================================================================

    /// @notice Maximum credentials verifiable in a single batch call
    uint256 public constant MAX_BATCH_SIZE = 50;

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(address _credentialNft, address _registry) {
        if (_credentialNft == address(0) || _registry == address(0)) {
            revert Verifier__ZeroAddress();
        }
        CREDENTIAL_NFT = SoulboundCredential(_credentialNft);
        REGISTRY = CredentialRegistry(_registry);
    }

    // =========================================================================
    // SINGLE CREDENTIAL VERIFICATION
    // =========================================================================

    /// @notice Verify a single credential by token ID
    /// @dev Primary entry point for employer verification portal
    /// @param tokenId The credential token ID to verify
    /// @return result Full verification breakdown
    function verify(uint256 tokenId)
        external
        view
        returns (VerificationResult memory result)
    {
        // Check existence first — everything else depends on it
        try CREDENTIAL_NFT.getCredential(tokenId) returns (
            ICredential.Credential memory cred
        ) {
            result.exists = true;
            result.revoked = cred.revoked;
            result.expired = cred.expiresAt != 0
                && block.timestamp > cred.expiresAt;
            result.credType = cred.credentialType;
            result.issuer = cred.issuer;
            result.holder = cred.holder;
            result.issuedAt = cred.issuedAt;
            result.expiresAt = cred.expiresAt;
            result.metadataHash = cred.metadataHash;

            // Check if the issuing institution is still trusted
            result.issuerTrusted = REGISTRY.isApproved(cred.issuer);

            // Credential is valid only if all conditions pass
            result.isValid = !result.revoked
                && !result.expired
                && result.issuerTrusted;
        } catch {
            // Token does not exist — return zero-value result with exists=false
            result.exists = false;
            result.isValid = false;
        }
    }

    /// @notice Quick boolean validity check — gas efficient for simple use cases
    /// @param tokenId The credential to check
    /// @return True only if credential is valid, not revoked, not expired,
    ///         and issuer is still trusted
    function isCredentialValid(uint256 tokenId) external view returns (bool) {
        try CREDENTIAL_NFT.getCredential(tokenId) returns (
            ICredential.Credential memory cred
        ) {
            if (cred.revoked) return false;
            if (cred.expiresAt != 0 && block.timestamp > cred.expiresAt) {
                return false;
            }
            if (!REGISTRY.isApproved(cred.issuer)) return false;
            return true;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // BATCH VERIFICATION
    // =========================================================================

    /// @notice Verify multiple credentials in one call
    /// @dev Capped at MAX_BATCH_SIZE to prevent gas limit issues
    /// @param tokenIds Array of token IDs to verify
    /// @return results Array of VerificationResult in same order as input
    function verifyBatch(uint256[] calldata tokenIds)
        external
        view
        returns (VerificationResult[] memory results)
    {
        if (tokenIds.length == 0) revert Verifier__EmptyTokenIdArray();
        if (tokenIds.length > MAX_BATCH_SIZE) {
            revert Verifier__BatchLimitExceeded(tokenIds.length, MAX_BATCH_SIZE);
        }

        results = new VerificationResult[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length;) {
            try CREDENTIAL_NFT.getCredential(tokenIds[i]) returns (
                ICredential.Credential memory cred
            ) {
                bool expired = cred.expiresAt != 0
                    && block.timestamp > cred.expiresAt;
                bool issuerTrusted = REGISTRY.isApproved(cred.issuer);

                results[i] = VerificationResult({
                    isValid: !cred.revoked && !expired && issuerTrusted,
                    exists: true,
                    revoked: cred.revoked,
                    expired: expired,
                    issuerTrusted: issuerTrusted,
                    credType: cred.credentialType,
                    issuer: cred.issuer,
                    holder: cred.holder,
                    issuedAt: cred.issuedAt,
                    expiresAt: cred.expiresAt,
                    metadataHash: cred.metadataHash
                });
            } catch {
                // Non-existent token — leave as zero-value, exists=false
                results[i].exists = false;
                results[i].isValid = false;
            }

            unchecked { i++; }
        }
    }

    // =========================================================================
    // PORTFOLIO VERIFICATION
    // =========================================================================

    /// @notice Build a complete credential portfolio summary for a worker
    /// @dev Used by lending pool to assess creditworthiness at a glance
    /// @param holder The worker's wallet address
    /// @return summary Aggregated portfolio data
    function getPortfolioSummary(address holder)
        external
        view
        returns (PortfolioSummary memory summary)
    {
        summary.holder = holder;

        uint256[] memory tokenIds = CREDENTIAL_NFT.getCredentialsByHolder(holder);
        summary.totalCredentials = tokenIds.length;

        for (uint256 i = 0; i < tokenIds.length;) {
            try CREDENTIAL_NFT.getCredential(tokenIds[i]) returns (
                ICredential.Credential memory cred
            ) {
                bool expired = cred.expiresAt != 0
                    && block.timestamp > cred.expiresAt;
                bool issuerTrusted = REGISTRY.isApproved(cred.issuer);
                bool valid = !cred.revoked && !expired && issuerTrusted;

                if (valid) {
                    unchecked { summary.validCredentials++; }

                    // Track credential type coverage
                    if (cred.credentialType == ICredential.CredentialType.DEGREE) {
                        summary.hasDegree = true;
                    } else if (
                        cred.credentialType == ICredential.CredentialType.LICENSE
                    ) {
                        summary.hasLicense = true;
                    } else if (
                        cred.credentialType == ICredential.CredentialType.CERTIFICATION
                    ) {
                        summary.hasCertification = true;
                    } else if (
                        cred.credentialType == ICredential.CredentialType.EMPLOYMENT
                    ) {
                        summary.hasEmploymentRecord = true;
                    }
                } else if (cred.revoked) {
                    unchecked { summary.revokedCredentials++; }
                } else if (expired) {
                    unchecked { summary.expiredCredentials++; }
                }
            } catch {
                // Skip non-existent tokens silently
            }

            unchecked { i++; }
        }
    }

    /// @notice Verify that a worker holds a valid credential of a specific type
    ///         from a trusted issuer — used by external protocols for gating
    /// @param holder The worker's wallet address
    /// @param credentialType The required credential type
    /// @return True if worker holds at least one valid credential of that type
    function holdsValidCredentialOfType(
        address holder,
        ICredential.CredentialType credentialType
    )
        external
        view
        returns (bool)
    {
        uint256[] memory tokenIds = CREDENTIAL_NFT.getCredentialsByHolder(holder);

        for (uint256 i = 0; i < tokenIds.length;) {
            try CREDENTIAL_NFT.getCredential(tokenIds[i]) returns (
                ICredential.Credential memory cred
            ) {
                if (cred.credentialType == credentialType) {
                    bool expired = cred.expiresAt != 0
                        && block.timestamp > cred.expiresAt;
                    if (!cred.revoked && !expired && REGISTRY.isApproved(cred.issuer)) {
                        return true;
                    }
                }
            } catch {}

            unchecked { i++; }
        }

        return false;
    }
}