"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/hooks/useWeb3";
import { CONTRACTS, FUJI_CHAIN_ID } from "@/lib/contracts";
import BgCanvas from "@/components/BgCanvas";

const DEPLOYER = "0x6DD6F038583a70eFEF80f5B0A34B9a60AC36Be39".toLowerCase();

const REGISTRY_ABI = [
  "function getPendingInstitutions() external view returns (address[])",
  "function getInstitution(address) external view returns (tuple(string name, string country, uint8 trustLevel, bool active, uint48 appliedAt, uint48 approvedAt, uint256 totalIssued))",
  "function approveInstitution(address institution, uint8 trustLevel) external",
  "function revokeInstitution(address institution) external",
];

type Institution = {
  address: string;
  name: string;
  country: string;
  trustLevel: number;
  active: boolean;
  appliedAt: number;
  totalIssued: number;
};

const TRUST_LABELS = ["Unverified", "Pending", "Verified", "Premium"];

export default function AdminPage() {
  const web3 = useWeb3();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isDeployer = web3.address?.toLowerCase() === DEPLOYER;

  const fetchPending = useCallback(async () => {
    if (!web3.signer) return;
    setLoading(true);
    setError(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const addresses: string[] = await registry.getPendingInstitutions();
      const details = await Promise.all(
        addresses.map(async (addr) => {
          const inst = await registry.getInstitution(addr);
          return {
            address: addr,
            name: inst.name,
            country: inst.country,
            trustLevel: Number(inst.trustLevel),
            active: inst.active,
            appliedAt: Number(inst.appliedAt),
            totalIssued: Number(inst.totalIssued),
          };
        })
      );
      setInstitutions(details);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load institutions");
    } finally {
      setLoading(false);
    }
  }, [web3.signer]);

  useEffect(() => {
    if (web3.connected && web3.chainId === FUJI_CHAIN_ID && isDeployer) {
      fetchPending();
    }
  }, [web3.connected, web3.chainId, isDeployer, fetchPending]);

  const approve = async (address: string, trustLevel: number) => {
    if (!web3.signer) return;
    setTxPending(address);
    setError(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const tx = await registry.approveInstitution(address, trustLevel);
      await tx.wait();
      setSuccess(`Approved ${address.slice(0, 10)}···`);
      await fetchPending();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setTxPending(null);
    }
  };

  const revoke = async (address: string) => {
    if (!web3.signer) return;
    setTxPending(address);
    setError(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const tx = await registry.revokeInstitution(address);
      await tx.wait();
      setSuccess(`Revoked ${address.slice(0, 10)}···`);
      await fetchPending();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setTxPending(null);
    }
  };

  if (!web3.connected) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, position: "relative", zIndex: 2 }}>
      <BgCanvas />
      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32 }}>Admin Panel</p>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Deployer wallet required.</p>
      <button className="btn-primary" onClick={web3.connect} disabled={web3.connecting}>
        {web3.connecting ? "Connecting···" : "Connect Wallet →"}
      </button>
      {web3.error && <p className="alert alert-error">{web3.error}</p>}
    </div>
  );

  if (web3.chainId !== FUJI_CHAIN_ID) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, position: "relative", zIndex: 2 }}>
      <BgCanvas />
      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32 }}>Wrong Network</p>
      <button className="btn-primary" onClick={web3.switchToFuji}>Switch to Fuji →</button>
    </div>
  );

  if (!isDeployer) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, position: "relative", zIndex: 2 }}>
      <BgCanvas />
      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 32 }}>Access Denied</p>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Connected: <code style={{ fontFamily: "monospace" }}>{web3.address}</code></p>
      <p style={{ color: "var(--muted)", fontSize: 13 }}>This panel requires the deployer wallet.</p>
      <button className="btn-ghost" onClick={web3.disconnect}>Disconnect</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      <BgCanvas />

      {/* Nav */}
      <nav style={{ padding: "20px clamp(20px,5vw,48px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18 }}>VeraFlow</span>
          <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(200,240,96,0.3)", borderRadius: 2 }}>Governance Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{web3.address?.slice(0,6)}···{web3.address?.slice(-4)}</span>
          <button className="btn-ghost" onClick={web3.disconnect} style={{ fontSize: 11, padding: "8px 12px" }}>Exit</button>
        </div>
      </nav>

      <main style={{ padding: "clamp(24px,5vw,48px) clamp(20px,5vw,48px)", maxWidth: 800, width: "100%" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Governance</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ fontSize: "clamp(32px,6vw,48px)", fontWeight: 800, lineHeight: 1 }}>
              Institution Registry
            </h1>
            <button className="btn-ghost" onClick={fetchPending} disabled={loading} style={{ fontSize: 12 }}>
              {loading ? "Loading···" : "Refresh ↺"}
            </button>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 12, lineHeight: 1.7 }}>
            Approve or revoke institutions. Approved institutions can issue soulbound credentials to workers.
          </p>
        </div>

        {error && <p className="alert alert-error" style={{ marginBottom: 24 }}>{error}</p>}
        {success && <p className="alert alert-success" style={{ marginBottom: 24 }}>{success}</p>}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 100, background: "var(--surface)", opacity: 0.4 + i * 0.1 }} />)}
          </div>
        )}

        {!loading && institutions.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No pending applications</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>New applications will appear here when institutions apply via the Issuer Dashboard.</p>
          </div>
        )}

        {!loading && institutions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
            {institutions.map((inst) => (
              <ApprovalCard
                key={inst.address}
                inst={inst}
                onApprove={approve}
                onRevoke={revoke}
                txPending={txPending === inst.address}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ApprovalCard({ inst, onApprove, onRevoke, txPending }: {
  inst: Institution;
  onApprove: (addr: string, level: number) => void;
  onRevoke: (addr: string) => void;
  txPending: boolean;
}) {
  const [selectedLevel, setSelectedLevel] = useState(2);

  return (
    <div className="card" style={{ borderRadius: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span className={`tag ${inst.active ? "tag-green" : "tag-amber"}`}>
              {inst.active ? "Active" : "Pending"}
            </span>
            <span className="number-label">{inst.country}</span>
          </div>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(18px,3vw,22px)" }}>{inst.name}</p>
          <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 6 }}>{inst.address}</p>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Applied {new Date(inst.appliedAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {inst.totalIssued > 0 && ` · ${inst.totalIssued} credentials issued`}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
          {!inst.active ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Trust level:</span>
                <select
                  className="select"
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(Number(e.target.value))}
                  style={{ padding: "6px 12px", fontSize: 12, width: "auto" }}
                >
                  <option value={2}>Verified</option>
                  <option value={3}>Premium</option>
                </select>
              </div>
              <button
                className="btn-primary"
                onClick={() => onApprove(inst.address, selectedLevel)}
                disabled={txPending}
                style={{ fontSize: 12, padding: "10px 20px" }}
              >
                {txPending ? "Approving···" : `Approve as ${TRUST_LABELS[selectedLevel]} →`}
              </button>
            </>
          ) : (
            <button
              className="btn-ghost"
              onClick={() => onRevoke(inst.address)}
              disabled={txPending}
              style={{ fontSize: 12, padding: "10px 20px", borderColor: "var(--danger)", color: "var(--danger)" }}
            >
              {txPending ? "Revoking···" : "Revoke"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

