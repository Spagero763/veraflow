"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { Identity } from "@/hooks/useWorkerIdentity";
import IdentityPanel from "./IdentityPanel";
import CredentialsPanel from "./CredentialsPanel";
import LoansPanel from "./LoansPanel";

type Tab = "identity" | "credentials" | "loans";

type Props = {
  address: string;
  identity: Identity | null;
  loading: boolean;
  txPending: boolean;
  register: () => Promise<void>;
  refreshScore: () => Promise<void>;
  signer: ethers.JsonRpcSigner | null;
  disconnect: () => void;
};

export default function Dashboard({ address, identity, loading, txPending, register, refreshScore, signer, disconnect }: Props) {
  const [tab, setTab] = useState<Tab>("identity");
  const short = `${address.slice(0, 6)}···${address.slice(-4)}`;

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto auto 1fr" }}>
      {/* Header */}
      <header style={{ padding: "20px 40px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18 }}>VeraFlow</span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {identity && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse-accent 2s infinite" }} />
              <span style={{ fontSize: 13, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 600 }}>
                {identity.reputationScore} pts
              </span>
            </div>
          )}
          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{short}</span>
          <button className="btn-ghost" onClick={disconnect} style={{ fontSize: 12, padding: "6px 12px" }}>Disconnect</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "0 40px", display: "flex", gap: 4 }}>
        {(["identity", "credentials", "loans"] as Tab[]).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "16px 20px",
              fontSize: 13,
              fontFamily: "Syne, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: tab === t ? "var(--text)" : "var(--muted)",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 10, color: "var(--muted)" }}>0{i + 1}</span>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ padding: "48px 40px", maxWidth: 760, width: "100%" }}>
        {tab === "identity" && <IdentityPanel address={address} identity={identity} loading={loading} txPending={txPending} register={register} refreshScore={refreshScore} />}
        {tab === "credentials" && <CredentialsPanel address={address} signer={signer} />}
        {tab === "loans" && <LoansPanel address={address} signer={signer} identity={identity} />}
      </main>
    </div>
  );
}
