export const CONTRACTS = {
  CREDENTIAL_NFT: "0xdc7041742002F70ec635015b2e10FE52dD406A3D",
  CREDENTIAL_REGISTRY: "0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad",
  CREDENTIAL_VERIFIER: "0x9E8fd6776d72f9C71471AAbC98F6f0e2333f4928",
  WORKER_IDENTITY: "0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766",
  REPUTATION_SCORE: "0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a",
  COLLATERAL_ORACLE: "0xD35374e2621f16580eb093B9792773E34cAbA76a",
} as const;

export const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
export const FUJI_CHAIN_ID = 43113;

export const CREDENTIAL_TYPES = [
  "Degree",
  "Certification",
  "License",
  "Employment",
  "Skill",
  "Identity",
] as const;

export const TRUST_LEVELS = ["Unverified", "Pending", "Verified", "Premium"] as const;

export const WORKER_IDENTITY_ABI = [
  "function isActive(address wallet) external view returns (bool)",
  "function getIdentity(address wallet) external view returns (tuple(address wallet, bytes32 didHash, bytes32 profileMetaHash, uint8 status, uint48 registeredAt, uint48 lastUpdatedAt, uint32 credentialCount, uint32 reputationScore))",
] as const;

export const CREDENTIAL_NFT_ABI = [
  "function getCredentialsByHolder(address holder) external view returns (uint256[])",
  "function getCredential(uint256 tokenId) external view returns (tuple(uint256 tokenId, address issuer, address holder, uint8 credentialType, uint8 burnAuth, uint48 issuedAt, uint48 expiresAt, bytes32 metadataHash, bool revoked))",
  "function isValid(uint256 tokenId) external view returns (bool)",
] as const;

export const CREDENTIAL_VERIFIER_ABI = [
  "function getPortfolioSummary(address holder) external view returns (tuple(uint256 totalCredentials, uint256 validCredentials, uint256 expiredCredentials, uint256 revokedCredentials, bool hasDegree, bool hasLicense, bool hasCertification, bool hasEmployment))",
  "function batchVerify(uint256[] tokenIds) external view returns (bool[])",
] as const;

export const COLLATERAL_ORACLE_ABI = [
  "function assess(address worker) external view returns (tuple(bool eligible, uint32 score, uint8 tier, uint256 creditLimit, uint256 utilizationMultiplier))",
] as const;

export const REPUTATION_SCORE_ABI = [
  "function previewScore(address worker) external view returns (uint32 credentialScore, uint32 longevityScore, uint32 loanScore, uint32 identityScore, uint32 total)",
] as const;

export const CREDENTIAL_REGISTRY_ABI = [
  "function getInstitution(address institution) external view returns (tuple(string name, string country, uint8 trustLevel, bool active, uint48 appliedAt, uint48 approvedAt, uint256 totalIssued))",
] as const;
