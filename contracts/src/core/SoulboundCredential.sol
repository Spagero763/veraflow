// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ICredential} from "../interfaces/ICredential.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title SoulboundCredential
/// @author Afolabi Emmanuel
/// @notice ERC-5484 compliant soulbound credential token for VeraFlow
contract SoulboundCredential is ICredential, ERC721, Ownable, Pausable, ReentrancyGuard {
    // =========================================================================
    // STATE
    // =========================================================================

    address public credentialRegistry;
    uint256 private _nextTokenId;

    mapping(uint256 => Credential) private _credentials;
    mapping(address => uint256[]) private _holderTokens;
    mapping(address => uint256[]) private _issuerTokens;
    mapping(uint256 => uint256) private _holderTokenIndex;

    // =========================================================================
    // MODIFIERS
    // =========================================================================

    modifier onlyRegistry() {
        _onlyRegistry();
        _;
    }

    modifier onlyValidCredential(uint256 tokenId) {
        _onlyValidCredential(tokenId);
        _;
    }

    function _onlyRegistry() internal view {
        if (msg.sender != credentialRegistry) {
            revert Credential__InvalidIssuer(msg.sender);
        }
    }

    function _onlyValidCredential(uint256 tokenId) internal view {
        if (!_exists(tokenId)) revert Credential__NotFound(tokenId);
        Credential storage cred = _credentials[tokenId];
        if (cred.revoked) revert Credential__AlreadyRevoked(tokenId);
        if (cred.expiresAt != 0 && block.timestamp > cred.expiresAt) {
            revert Credential__Expired(tokenId, cred.expiresAt);
        }
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    constructor(address initialOwner)
        ERC721("VeraFlow Credential", "VFC")
        Ownable(initialOwner)
    {
        _nextTokenId = 1;
    }

    // =========================================================================
    // ADMIN
    // =========================================================================

    function setCredentialRegistry(address registry) external onlyOwner {
        if (registry == address(0)) revert Credential__InvalidIssuer(address(0));
        credentialRegistry = registry;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // =========================================================================
    // CORE — ISSUE
    // =========================================================================

    /// @inheritdoc ICredential
    function issue(
        address issuer,
        address holder,
        CredentialType credentialType,
        BurnAuth burnAuthValue,
        uint48 expiresAt,
        bytes32 metadataHash
    )
        external
        override
        onlyRegistry
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        if (issuer == address(0)) revert Credential__InvalidIssuer(issuer);
        if (holder == address(0)) revert Credential__InvalidHolder(holder);
        if (metadataHash == bytes32(0)) revert Credential__InvalidMetadataHash();
        if (expiresAt != 0 && expiresAt <= uint48(block.timestamp)) {
            revert Credential__ExpiryBeforeIssuance();
        }

        tokenId = _nextTokenId;
        unchecked { _nextTokenId++; }

        _credentials[tokenId] = Credential({
            tokenId: tokenId,
            issuer: issuer,
            holder: holder,
            credentialType: credentialType,
            burnAuth: burnAuthValue,
            issuedAt: uint48(block.timestamp),
            expiresAt: expiresAt,
            metadataHash: metadataHash,
            revoked: false
        });

        _holderTokenIndex[tokenId] = _holderTokens[holder].length;
        _holderTokens[holder].push(tokenId);
        _issuerTokens[issuer].push(tokenId);

        _safeMint(holder, tokenId);

        emit Issued(tokenId, issuer, holder, burnAuthValue);
    }

    // =========================================================================
    // CORE — REVOKE
    // =========================================================================

    /// @inheritdoc ICredential
    function revoke(uint256 tokenId, string calldata reason)
        external
        override
        whenNotPaused
        nonReentrant
    {
        if (!_exists(tokenId)) revert Credential__NotFound(tokenId);
        Credential storage cred = _credentials[tokenId];
        if (cred.revoked) revert Credential__AlreadyRevoked(tokenId);
        if (msg.sender != cred.issuer) revert Credential__InvalidIssuer(msg.sender);
        cred.revoked = true;
        emit CredentialRevoked(tokenId, cred.issuer, cred.holder, reason);
    }

    // =========================================================================
    // CORE — BURN
    // =========================================================================

    function burn(uint256 tokenId) external nonReentrant {
        if (!_exists(tokenId)) revert Credential__NotFound(tokenId);

        Credential storage cred = _credentials[tokenId];
        BurnAuth auth = cred.burnAuth;
        bool authorized = false;

        if (auth == BurnAuth.IssuerOnly) {
            authorized = msg.sender == cred.issuer;
        } else if (auth == BurnAuth.OwnerOnly) {
            authorized = msg.sender == cred.holder;
        } else if (auth == BurnAuth.Both) {
            authorized = msg.sender == cred.issuer || msg.sender == cred.holder;
        } else if (auth == BurnAuth.Neither) {
            authorized = false;
        }

        if (!authorized) revert Credential__UnauthorizedBurn(msg.sender, tokenId);

        _removeFromHolderIndex(cred.holder, tokenId);
        delete _credentials[tokenId];
        _burn(tokenId);
    }

    // =========================================================================
    // ERC-5484
    // =========================================================================

    /// @inheritdoc ICredential
    function burnAuth(uint256 tokenId) external view override returns (BurnAuth) {
        if (!_exists(tokenId)) revert Credential__NotFound(tokenId);
        return _credentials[tokenId].burnAuth;
    }

    // =========================================================================
    // SOULBOUND
    // =========================================================================

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert Credential__NotTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    /// @inheritdoc ICredential
    function isValid(uint256 tokenId) external view override returns (bool) {
        if (!_exists(tokenId)) return false;
        Credential storage cred = _credentials[tokenId];
        if (cred.revoked) return false;
        if (cred.expiresAt != 0 && block.timestamp > cred.expiresAt) return false;
        return true;
    }

    /// @inheritdoc ICredential
    function getCredential(uint256 tokenId)
        external
        view
        override
        returns (Credential memory)
    {
        if (!_exists(tokenId)) revert Credential__NotFound(tokenId);
        return _credentials[tokenId];
    }

    /// @inheritdoc ICredential
    function getCredentialsByHolder(address holder)
        external
        view
        override
        returns (uint256[] memory)
    {
        return _holderTokens[holder];
    }

    /// @inheritdoc ICredential
    function getCredentialsByIssuer(address issuer)
        external
        view
        override
        returns (uint256[] memory)
    {
        return _issuerTokens[issuer];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // =========================================================================
    // INTERNAL
    // =========================================================================

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _removeFromHolderIndex(address holder, uint256 tokenId) internal {
        uint256[] storage tokens = _holderTokens[holder];
        uint256 index = _holderTokenIndex[tokenId];
        uint256 lastIndex = tokens.length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = tokens[lastIndex];
            tokens[index] = lastTokenId;
            _holderTokenIndex[lastTokenId] = index;
        }

        tokens.pop();
        delete _holderTokenIndex[tokenId];
    }
}
