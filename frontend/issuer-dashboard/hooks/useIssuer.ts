"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACTS,
  CREDENTIAL_REGISTRY_ABI,
  WORKER_IDENTITY_ABI,
} from "@/lib/contracts";

export type Institution = {
  name: string;
  country: string;
  trustLevel: number;
  active: boolean;
  appliedAt: number;
  approvedAt: number;
  totalIssued: number;
  remainingDailyLimit: number;
};

export function useIssuer(signer: ethers.JsonRpcSigner | null, address: string | null) {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInstitution = useCallback(async () => {
    if (!signer || !address) return;
    setLoading(true);
    try {
      const registry = new ethers.Contract(
        CONTRACTS.CREDENTIAL_REGISTRY, CREDENTIAL_REGISTRY_ABI, signer
      );
      try {
        const inst = await registry.getInstitution(address);
        if (!inst.name) { setInstitution(null); return; }
        let remaining = 0;
        if (inst.active) {
          try { remaining = Number(await registry.getRemainingDailyLimit(address)); } catch {}
        }
        setInstitution({
          name: inst.name,
          country: inst.country,
          trustLevel: Number(inst.trustLevel),
          active: inst.active,
          appliedAt: Number(inst.registeredAt),
          approvedAt: Number(inst.approvedAt),
          totalIssued: Number(inst.totalIssued),
          remainingDailyLimit: Math.max(0, 100 - Number(inst.dailyIssued)),
        });
      } catch { setInstitution(null); }
    } finally {
      setLoading(false);
    }
  }, [signer, address]);

  const apply = useCallback(async (name: string, country: string) => {
    if (!signer) return;
    setTxPending(true);
    setError(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(
        CONTRACTS.CREDENTIAL_REGISTRY, CREDENTIAL_REGISTRY_ABI, signer
      );
      const tx = await registry.applyForRegistry(name, country);
      await tx.wait();
      setSuccess("Application submitted. Awaiting governance approval.");
      await fetchInstitution();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Application failed");
    } finally {
      setTxPending(false);
    }
  }, [signer, fetchInstitution]);

  const issueCredential = useCallback(async (
    holder: string,
    credentialType: number,
    burnAuth: number,
    expiresAt: number,
    metadataNote: string
  ) => {
    if (!signer) return;
    setTxPending(true);
    setError(null);
    setSuccess(null);
    try {
      // Check holder is registered
      const identity = new ethers.Contract(
        CONTRACTS.WORKER_IDENTITY, WORKER_IDENTITY_ABI, signer
      );
      const isActive = await identity.isActive(holder);
      if (!isActive) {
        setError("Holder address has no registered VeraFlow identity.");
        return;
      }
      const registry = new ethers.Contract(
        CONTRACTS.CREDENTIAL_REGISTRY, CREDENTIAL_REGISTRY_ABI, signer
      );
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(metadataNote || holder));
      const tx = await registry.issueCredential(
        holder,
        credentialType,
        burnAuth,
        expiresAt,
        metadataHash
      );
      const receipt = await tx.wait();
      const tokenId = receipt?.logs?.[0]?.topics?.[3]
        ? BigInt(receipt.logs[0].topics[3]).toString()
        : "unknown";
      setSuccess(`Credential issued. Token ID: ${tokenId}`);
      await fetchInstitution();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Issuance failed");
    } finally {
      setTxPending(false);
    }
  }, [signer, fetchInstitution]);

  return { institution, loading, txPending, error, success, fetchInstitution, apply, issueCredential };
}
