import { ethers } from "ethers";

export const CONTRACTS = {
  CREDENTIAL_NFT: "0xdc7041742002F70ec635015b2e10FE52dD406A3D",
  CREDENTIAL_REGISTRY: "0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad",
  CREDENTIAL_VERIFIER: "0x9E8fd6776d72f9C71471AAbC98F6f0e2333f4928",
  WORKER_IDENTITY: "0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766",
  REPUTATION_SCORE: "0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a",
  LENDING_POOL: "0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc",
  LOAN_MANAGER: "0x4B66Edc9e30711FFa273c84e5f1df46BE9103cc1",
  COLLATERAL_ORACLE: "0xD35374e2621f16580eb093B9792773E34cAbA76a",
} as const;

export const FUJI_CHAIN_ID = 43113;

export const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

export const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/1743015/veraflow-protocol/v0.0.1";

// Minimal ABIs — only what the frontend needs
export const WORKER_IDENTITY_ABI = [
  "function register(bytes32 profileMetaHash) external",
  "function updateProfile(bytes32 newHash) external",
  "function deactivate() external",
  "function isActive(address wallet) external view returns (bool)",
  "function getIdentity(address wallet) external view returns (tuple(address wallet, bytes32 didHash, bytes32 profileMetaHash, uint8 status, uint48 registeredAt, uint48 lastUpdatedAt, uint32 credentialCount, uint32 reputationScore))",
  "function getReputationScore(address wallet) external view returns (uint32)",
  "event IdentityRegistered(address indexed wallet, bytes32 indexed didHash, uint48 registeredAt)",
] as const;

export const CREDENTIAL_REGISTRY_ABI = [
  "function issueCredential(address holder, uint8 credentialType, uint8 burnAuth, uint48 expiresAt, bytes32 metadataHash) external returns (uint256)",
  "function isApproved(address institution) external view returns (bool)",
  "function getInstitution(address institution) external view returns (tuple(string name, string country, uint8 trustLevel, bool active, uint48 appliedAt, uint48 approvedAt, uint256 totalIssued))",
  "function applyForRegistry(string name, string country) external",
] as const;

export const CREDENTIAL_NFT_ABI = [
  "function getCredential(uint256 tokenId) external view returns (tuple(uint256 tokenId, address issuer, address holder, uint8 credentialType, uint8 burnAuth, uint48 issuedAt, uint48 expiresAt, bytes32 metadataHash, bool revoked))",
  "function getCredentialsByHolder(address holder) external view returns (uint256[])",
  "function isValid(uint256 tokenId) external view returns (bool)",
  "function revoke(uint256 tokenId, string reason) external",
] as const;

export const REPUTATION_SCORE_ABI = [
  "function computeAndWrite(address worker) external",
  "function previewScore(address worker) external view returns (uint32 credentialScore, uint32 longevityScore, uint32 loanScore, uint32 identityScore, uint32 total)",
] as const;

export const LENDING_POOL_ABI = [
  "function borrow(uint256 amount) external returns (uint256 loanId)",
  "function repay(uint256 loanId, uint256 amount) external",
  "function getLoan(uint256 loanId) external view returns (tuple(uint256 loanId, address borrower, uint256 principal, uint256 totalRepayable, uint256 interestRate, uint8 tier, uint8 status, uint48 originatedAt, uint48 dueAt))",
  "function availableLiquidity() external view returns (uint256)",
  "function getTierForScore(uint32 score) external view returns (tuple(uint32 minScore, uint32 maxScore, uint256 maxLoanAmount, uint256 interestRate, uint48 duration))",
] as const;

export const COLLATERAL_ORACLE_ABI = [
  "function getCreditLimit(address worker) external view returns (uint256)",
  "function assess(address worker) external view returns (tuple(bool eligible, uint32 score, uint8 tier, uint256 creditLimit, uint256 utilizationMultiplier))",
] as const;

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
] as const;

export const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";

export const CREDENTIAL_TYPES = [
  "Degree",
  "Certification",
  "License",
  "Employment",
  "Skill",
  "Identity",
] as const;

export const LOAN_STATUS = ["Active", "Repaid", "Defaulted"] as const;
