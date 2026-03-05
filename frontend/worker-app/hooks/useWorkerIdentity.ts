"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACTS,
  WORKER_IDENTITY_ABI,
  REPUTATION_SCORE_ABI,
} from "@/lib/contracts";

export type Identity = {
  didHash: string;
  status: number;
  profileMetaHash: string;
  reputationScore: number;
  credentialCount: number;
  registeredAt: number;
};

export function useWorkerIdentity(
  signer: ethers.JsonRpcSigner | null,
  address: string | null
) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txPending, setTxPending] = useState(false);

  const fetchIdentity = useCallback(async () => {
    if (!address || !signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(
        CONTRACTS.WORKER_IDENTITY,
        WORKER_IDENTITY_ABI,
        signer
      );
      const isActive = await contract.isActive(address);
      if (!isActive) {
        setIdentity(null);
        return;
      }
      const data = await contract.getIdentity(address);
      setIdentity({
        didHash: data.didHash,
        status: Number(data.status),
        profileMetaHash: data.profileMetaHash,
        reputationScore: Number(data.reputationScore),
        credentialCount: Number(data.credentialCount),
        registeredAt: Number(data.registeredAt),
      });
    } catch {
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  }, [address, signer]);

  const register = useCallback(async () => {
    if (!signer) return;
    setTxPending(true);
    setError(null);
    try {
      const contract = new ethers.Contract(
        CONTRACTS.WORKER_IDENTITY,
        WORKER_IDENTITY_ABI,
        signer
      );
      const profileHash = ethers.keccak256(
        ethers.toUtf8Bytes(`veraflow:profile:${await signer.getAddress()}`)
      );
      const tx = await contract.register(profileHash);
      await tx.wait();
      await fetchIdentity();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setTxPending(false);
    }
  }, [signer, fetchIdentity]);

  const refreshScore = useCallback(async () => {
    if (!signer || !address) return;
    setTxPending(true);
    setError(null);
    try {
      const contract = new ethers.Contract(
        CONTRACTS.REPUTATION_SCORE,
        REPUTATION_SCORE_ABI,
        signer
      );
      const tx = await contract.computeAndWrite(address);
      await tx.wait();
      await fetchIdentity();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Score refresh failed");
    } finally {
      setTxPending(false);
    }
  }, [signer, address, fetchIdentity]);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  return { identity, loading, error, txPending, register, refreshScore, refetch: fetchIdentity };
}
