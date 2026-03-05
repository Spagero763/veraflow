export const CONTRACTS = {
  CREDENTIAL_REGISTRY: "0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad",
  CREDENTIAL_NFT: "0xdc7041742002F70ec635015b2e10FE52dD406A3D",
  WORKER_IDENTITY: "0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766",
} as const;

export const FUJI_CHAIN_ID = 43113;
export const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

export const CREDENTIAL_TYPES = [
  { value: 0, label: "Degree" },
  { value: 1, label: "Certification" },
  { value: 2, label: "License" },
  { value: 3, label: "Employment" },
  { value: 4, label: "Skill" },
  { value: 5, label: "Identity" },
] as const;

export const BURN_AUTH_TYPES = [
  { value: 0, label: "Issuer Only" },
  { value: 1, label: "Owner Only" },
  { value: 2, label: "Both" },
  { value: 3, label: "Neither" },
] as const;

export const TRUST_LEVELS = ["Unverified", "Pending", "Verified", "Premium"] as const;

export const CREDENTIAL_REGISTRY_ABI = [
  "function applyForRegistry(string name, string country) external",
  "function issueCredential(address holder, uint8 credentialType, uint8 burnAuth, uint48 expiresAt, bytes32 metadataHash) external returns (uint256)",
  "function isApproved(address institution) external view returns (bool)",
  "function getInstitution(address institution) external view returns (tuple(address wallet, string name, string country, uint8 trustLevel, uint48 registeredAt, uint48 approvedAt, uint256 totalIssued, uint256 dailyIssued, uint48 dailyResetAt, bool active))",
  "function getRemainingDailyLimit(address institution) external view returns (uint256)",
  "event InstitutionApplied(address indexed institution, string name, string country, uint48 appliedAt)",
  "event CredentialIssued(address indexed institution, address indexed holder, uint256 indexed tokenId, uint8 credentialType)",
] as const;

export const WORKER_IDENTITY_ABI = [
  "function isActive(address wallet) external view returns (bool)",
] as const;
