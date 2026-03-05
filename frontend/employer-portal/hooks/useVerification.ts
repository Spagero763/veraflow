"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  FUJI_RPC,
  CONTRACTS,
  WORKER_IDENTITY_ABI,
  CREDENTIAL_NFT_ABI,
  CREDENTIAL_VERIFIER_ABI,
  COLLATERAL_ORACLE_ABI,
  REPUTATION_SCORE_ABI,
  CREDENTIAL_REGISTRY_ABI,
  CREDENTIAL_TYPES,
  TRUST_LEVELS,
} from "@/lib/contracts";

export type CredentialDetail = {
  tokenId: bigint;
  issuer: string;
  issuerName: string;
  issuerTrustLevel: number;
  credentialType: number;
  credentialTypeLabel: string;
  issuedAt: number;
  expiresAt: number;
  valid: boolean;
  revoked: boolean;
};

export type WorkerProfile = {
  address: string;
  didHash: string;
  reputationScore: number;
  credentialCount: number;
  registeredAt: number;
  status: number;
  // Score breakdown
  credentialScore: number;
  longevityScore: number;
  loanScore: number;
  identityScore: number;
  // Credit
  eligible: boolean;
  tier: number;
  creditLimit: bigint;
  // Portfolio
  totalCredentials: number;
  validCredentials: number;
  expiredCredentials: number;
  revokedCredentials: number;
  hasDegree: boolean;
  hasLicense: boolean;
  hasCertification: boolean;
  hasEmployment: boolean;
  // Credentials
  credentials: CredentialDetail[];
};

export function useVerification() {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      if (!ethers.isAddress(address)) {
        setError("Invalid Ethereum address.");
        return;
      }

      const provider = new ethers.JsonRpcProvider(FUJI_RPC);

      const identityContract = new ethers.Contract(
        CONTRACTS.WORKER_IDENTITY, WORKER_IDENTITY_ABI, provider
      );
      const nftContract = new ethers.Contract(
        CONTRACTS.CREDENTIAL_NFT, CREDENTIAL_NFT_ABI, provider
      );
      const verifierContract = new ethers.Contract(
        CONTRACTS.CREDENTIAL_VERIFIER, CREDENTIAL_VERIFIER_ABI, provider
      );
      const oracleContract = new ethers.Contract(
        CONTRACTS.COLLATERAL_ORACLE, COLLATERAL_ORACLE_ABI, provider
      );
      const scoreContract = new ethers.Contract(
        CONTRACTS.REPUTATION_SCORE, REPUTATION_SCORE_ABI, provider
      );
      const registryContract = new ethers.Contract(
        CONTRACTS.CREDENTIAL_REGISTRY, CREDENTIAL_REGISTRY_ABI, provider
      );

      // Check if registered
      const isActive = await identityContract.isActive(address);
      if (!isActive) {
        setError("This address has no registered VeraFlow identity.");
        return;
      }

      // Fetch all data in parallel
      const [identity, tokenIds, portfolio, assessment, scoreBreakdown] =
        await Promise.all([
          identityContract.getIdentity(address),
          nftContract.getCredentialsByHolder(address),
          verifierContract.getPortfolioSummary(address),
          oracleContract.assess(address),
          scoreContract.previewScore(address),
        ]);

      // Fetch credential details + issuer names
      const credentials: CredentialDetail[] = await Promise.all(
        tokenIds.map(async (tokenId: bigint) => {
          const [cred, valid] = await Promise.all([
            nftContract.getCredential(tokenId),
            nftContract.isValid(tokenId),
          ]);

          let issuerName = cred.issuer.slice(0, 6) + "..." + cred.issuer.slice(-4);
          let issuerTrustLevel = 0;
          try {
            const inst = await registryContract.getInstitution(cred.issuer);
            if (inst.name) {
              issuerName = inst.name;
              issuerTrustLevel = Number(inst.trustLevel);
            }
          } catch {
            // Issuer not in registry
          }

          return {
            tokenId,
            issuer: cred.issuer,
            issuerName,
            issuerTrustLevel,
            credentialType: Number(cred.credentialType),
            credentialTypeLabel: CREDENTIAL_TYPES[Number(cred.credentialType)] ?? "Unknown",
            issuedAt: Number(cred.issuedAt),
            expiresAt: Number(cred.expiresAt),
            valid,
            revoked: cred.revoked,
          };
        })
      );

      setProfile({
        address,
        didHash: identity.didHash,
        reputationScore: Number(identity.reputationScore),
        credentialCount: Number(identity.credentialCount),
        registeredAt: Number(identity.registeredAt),
        status: Number(identity.status),
        credentialScore: Number(scoreBreakdown.credentialScore),
        longevityScore: Number(scoreBreakdown.longevityScore),
        loanScore: Number(scoreBreakdown.loanScore),
        identityScore: Number(scoreBreakdown.identityScore),
        eligible: assessment.eligible,
        tier: Number(assessment.tier),
        creditLimit: assessment.creditLimit,
        totalCredentials: Number(portfolio.totalCredentials),
        validCredentials: Number(portfolio.validCredentials),
        expiredCredentials: Number(portfolio.expiredCredentials),
        revokedCredentials: Number(portfolio.revokedCredentials),
        hasDegree: portfolio.hasDegree,
        hasLicense: portfolio.hasLicense,
        hasCertification: portfolio.hasCertification,
        hasEmployment: portfolio.hasEmployment,
        credentials,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, verify };
}
