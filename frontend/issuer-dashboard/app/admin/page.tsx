"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/hooks/useWeb3";
import { CONTRACTS, FUJI_CHAIN_ID } from "@/lib/contracts";
import BgCanvas from "@/components/BgCanvas";

const DEPLOYER = "0x6DD6F038583a70eFEF80f5B0A34B9a60AC36Be39".toLowerCase();

const REGISTRY_ABI = [
  "function getInstitution(address) external view returns (tuple(string name, string country, uint8 trustLevel, bool active, uint48 appliedAt, uint48 approvedAt, uint256 totalIssued))",
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
  appliedAt: number;
  totalIssued: number;
};

export default function AdminPage() {
  const web3 = useWeb3();
  const [search, setSearch] = useState("");
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState(2);

  const isDeployer = web3.address?.toLowerCase() === DEPLOYER;

  const lookup = useCallback(async () => {
    if (!web3.signer || !search.trim()) return;
    setLoading(true);
    setError(null);
    setInstitution(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const inst = await registry.getInstitution(search.trim());
      if (!inst.name) { setError("No institution found at this address."); return; }
      setInstitution({
        address: search.trim(),
        name: inst.name,
        country: inst.country,
        trustLevel: Number(inst.trustLevel),
        active: inst.active,
        appliedAt: Number(inst.appliedAt),
        totalIssued: Number(inst.totalIssued),
      });
    } catch {
      setError("No institution found at this address.");
    } finally {
      setLoading(false);
    }
  }, [web3.signer, search]);

  const approve = async () => {
    if (!web3.signer || !institution) return;
    setTxPending(true);
    setError(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const tx = await registry.approveInstitution(institution.address, selectedLevel);
      await tx.wait();
      setSuccess(`✓ Approved as ${TRUST_LABELS[selectedLevel]}`);
      await lookup();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setTxPending(false);
    }
  };

  const revoke = async () => {
    if (!web3.signer || !institution) return;
    setTxPending(true);
    setError(null);
    setSuccess(null);
    try {
      const registry = new ethers.Contract(CONTRACTS.CREDENTIAL_REGISTRY, REGISTRY_ABI, web3.signer);
      const tx = await registry.revokeInstitution(institution.address);
      await tx.wait();
      setSuccess("✓ Institution revoked");
      await lookup();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setTxPending(false);
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
      <p style={{ color: "var(--muted)", fontSize: 13 }}>This panel is only accessible to the deployer wallet.</p>
      <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>Connected: {web3.address}</p>
      <button className="btn-ghost" onClick={web3.disconnect}>Disconnect</button>
    </div>
  );

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
          <button className="btn-ghost" onClick={web3.disconnect} style={{ fontSize: 11, padding: "8px 12px" }}>Exit</button>
        </div>
      </nav>

      <main style={{ padding: "clamp(24px,5vw,48px) clamp(20px,5vw,48px)", maxWidth: 680, width: "100%" }}>
        <div style={{ marginBottom: 40 }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Governance</p>
          <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 800, marginBottom: 12 }}>Institution Approval</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
            Paste an institution's wallet address to look up their application and approve or revoke their status.
          </p>
        </div>

        {/* Search */}
        <div className="card-accent" style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Look up institution</p>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && lookup()}
              placeholder="Paste wallet address 0x..."
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <button className="btn-primary" onClick={lookup} disabled={loading || !search.trim()} style={{ flexShrink: 0, fontSize: 12 }}>
              {loading ? "···" : "Look up →"}
            </button>
          </div>
        </div>

        {error && <p className="alert alert-error" style={{ marginBottom: 24 }}>{error}</p>}
        {success && <p className="alert alert-success" style={{ marginBottom: 24 }}>{success}</p>}

        {institution && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
            {/* Institution details */}
            <div className="card" style={{ borderRadius: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span className={`tag ${institution.active ? "tag-green" : "tag-amber"}`}>
                      {institution.active ? "Active" : "Pending"}
                    </span>
                    <span className="number-label">{institution.country}</span>
                    <span className="number-label" style={{ color: "var(--muted)" }}>Trust: {TRUST_LABELS[institution.trustLevel]}</span>
                  </div>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(20px,3vw,26px)" }}>{institution.name}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 6, wordBreak: "break-all" }}>{institution.address}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", marginBottom: 20 }}>
                {[
                  { label: "Applied", value: new Date(institution.appliedAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
                  { label: "Credentials Issued", value: institution.totalIssued.toString() },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--surface)", padding: "16px 20px" }}>
                    <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {!institution.active ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    className="select"
                    value={selectedLevel}
                    onChange={e => setSelectedLevel(Number(e.target.value))}
                    style={{ width: "auto", fontSize: 13 }}
                  >
                    <option value={2}>Verified</option>
                    <option value={3}>Premium</option>
                  </select>
                  <button className="btn-primary" onClick={approve} disabled={txPending} style={{ fontSize: 13 }}>
                    {txPending ? "Approving···" : `Approve as ${TRUST_LABELS[selectedLevel]} →`}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>This institution is active and can issue credentials.</p>
                  <button
                    onClick={revoke}
                    disabled={txPending}
                    style={{ background: "none", border: "1px solid var(--danger)", color: "var(--danger)", borderRadius: 2, padding: "10px 20px", fontSize: 12, cursor: "pointer", fontFamily: "Syne, sans-serif", fontWeight: 700 }}
                  >
                    {txPending ? "Revoking···" : "Revoke"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
