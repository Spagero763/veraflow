"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/hooks/useWeb3";
import { CONTRACTS, FUJI_CHAIN_ID } from "@/lib/contracts";
import BgCanvas from "@/components/BgCanvas";

const DEPLOYER = "0x6DD6F038583a70eFEF80f5B0A34B9a60AC36Be39".toLowerCase();

const REGISTRY_ABI = [
  "function getInstitutions(uint256 offset, uint256 limit) external view returns (address[])",
  "function getInstitution(address wallet) external view returns (tuple(address wallet, string name, string country, uint8 trustLevel, uint48 registeredAt, uint48 approvedAt, uint256 totalIssued, uint256 dailyIssued, uint48 dailyResetAt, bool active))",
  "function approveInstitution(address institution, uint8 trustLevel) external",
  "function revokeInstitution(address institution) external",
];

const TRUST_LABELS = ["Unverified", "Pending", "Verified", "Premium"];

type Institution = {
  address: string;
  name: string;
  country: string;
  trustLevel: number;
  active: boolean;
  registeredAt: number;
  totalIssued: number;
};

export default function AdminPage() {
  const web3 = useWeb3();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<Record<string, number>>({});

  const isDeployer = web3.address?.toLowerCase() === DEPLOYER;

  const fetchAll = useCallback(async () => {
    if (!web3.signer) return;
    setLoading(true);
    setError(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const addresses: string[] = await registry.getInstitutions(0, 100);
      const details = await Promise.all(
        addresses.map(async (addr) => {
          try {
            const inst = await registry.getInstitution(addr);
            return {
              address: addr,
              name: inst.name,
              country: inst.country,
              trustLevel: Number(inst.trustLevel),
              active: inst.active,
              registeredAt: Number(inst.registeredAt),
              totalIssued: Number(inst.totalIssued),
            } as Institution;
          } catch {
            return null;
          }
        })
      );
      setInstitutions(details.filter(Boolean) as Institution[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load institutions");
    } finally {
      setLoading(false);
    }
  }, [web3.signer]);

  useEffect(() => {
    if (web3.connected && web3.chainId === FUJI_CHAIN_ID && isDeployer) {
      fetchAll();
    }
  }, [web3.connected, web3.chainId, isDeployer, fetchAll]);

  const approve = async (address: string) => {
    if (!web3.signer) return;
    const level = selectedLevels[address] ?? 2;
    setTxPending(address);
    setError(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const tx = await registry.approveInstitution(address, level);
      await tx.wait();
      setSuccess(`✓ Approved as ${TRUST_LABELS[level]}`);
      await fetchAll();
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
      setSuccess("✓ Institution revoked");
      await fetchAll();
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
      <p style={{ color: "var(--muted)", fontSize: 13 }}>Deployer wallet only.</p>
      <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>Connected: {web3.address}</p>
      <button className="btn-ghost" onClick={web3.disconnect}>Disconnect</button>
    </div>
  );

  const pending = institutions.filter(i => !i.active);
  const active = institutions.filter(i => i.active);

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      <BgCanvas />

      <nav style={{ padding: "20px clamp(20px,5vw,48px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18 }}>VeraFlow</span>
          <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(200,240,96,0.3)", borderRadius: 2 }}>Governance Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{web3.address?.slice(0,6)}···{web3.address?.slice(-4)}</span>
          <button className="btn-ghost" onClick={fetchAll} disabled={loading} style={{ fontSize: 11, padding: "8px 12px" }}>{loading ? "···" : "Refresh ↺"}</button>
          <button className="btn-ghost" onClick={web3.disconnect} style={{ fontSize: 11, padding: "8px 12px" }}>Exit</button>
        </div>
      </nav>

      <main style={{ padding: "clamp(24px,5vw,48px) clamp(20px,5vw,48px)", maxWidth: 800, width: "100%" }}>
        <div style={{ marginBottom: 40 }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Governance</p>
          <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 800, marginBottom: 12 }}>Institution Registry</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
            {institutions.length} institutions · {pending.length} pending · {active.length} active
          </p>
        </div>

        {error && <p className="alert alert-error" style={{ marginBottom: 24 }}>{error}</p>}
        {success && <p className="alert alert-success" style={{ marginBottom: 24 }}>{success}</p>}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 100, background: "var(--surface)", opacity: 0.3 + i * 0.1 }} />)}
          </div>
        )}

        {/* Pending */}
        {!loading && pending.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p className="number-label" style={{ color: "var(--warning)", marginBottom: 16 }}>Pending Approval ({pending.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
              {pending.map(inst => (
                <div key={inst.address} className="card" style={{ borderRadius: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span className="tag tag-amber">Pending</span>
                        <span className="number-label">{inst.country}</span>
                      </div>
                      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(16px,2.5vw,22px)" }}>{inst.name}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 4, wordBreak: "break-all" }}>{inst.address}</p>
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                        Applied {new Date(inst.registeredAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        className="select"
                        value={selectedLevels[inst.address] ?? 2}
                        onChange={e => setSelectedLevels(prev => ({ ...prev, [inst.address]: Number(e.target.value) }))}
                        style={{ width: "auto", fontSize: 12, padding: "8px 12px" }}
                      >
                        <option value={2}>Verified</option>
                        <option value={3}>Premium</option>
                      </select>
                      <button
                        className="btn-primary"
                        onClick={() => approve(inst.address)}
                        disabled={txPending === inst.address}
                        style={{ fontSize: 12, padding: "10px 18px" }}
                      >
                        {txPending === inst.address ? "Approving···" : `Approve →`}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active */}
        {!loading && active.length > 0 && (
          <div>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Active Institutions ({active.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
              {active.map(inst => (
                <div key={inst.address} className="card" style={{ borderRadius: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span className="tag tag-green">Active</span>
                        <span className="tag tag-dim">{TRUST_LABELS[inst.trustLevel]}</span>
                        <span className="number-label">{inst.country}</span>
                      </div>
                      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(16px,2.5vw,22px)" }}>{inst.name}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 4, wordBreak: "break-all" }}>{inst.address}</p>
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{inst.totalIssued} credentials issued</p>
                    </div>
                    <button
                      onClick={() => revoke(inst.address)}
                      disabled={txPending === inst.address}
                      style={{ background: "none", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 2, padding: "10px 18px", fontSize: 12, cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700, flexShrink: 0 }}
                    >
                      {txPending === inst.address ? "Revoking···" : "Revoke"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && institutions.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18 }}>No institutions yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
