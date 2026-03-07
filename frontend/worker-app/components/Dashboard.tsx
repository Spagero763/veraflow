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

const TABS: { id: Tab; label: string; n: string }[] = [
  { id: "identity",    label: "Identity",    n: "01" },
  { id: "credentials", label: "Credentials", n: "02" },
  { id: "loans",       label: "Credit",      n: "03" },
];

export default function Dashboard({ address, identity, loading, txPending, register, refreshScore, signer, disconnect }: Props) {
  const [tab, setTab] = useState<Tab>("identity");
  const short = `${address.slice(0, 6)}···${address.slice(-4)}`;

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto auto 1fr" }}>

      {/* Header */}
      <header style={{
        padding: "0 clamp(20px,5vw,48px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, position: "sticky", top: 0,
        background: "rgba(8,8,7,0.85)", backdropFilter: "blur(20px)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" }}>VeraFlow</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Worker</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {identity && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", border: "1px solid rgba(200,240,96,0.2)", borderRadius: 100, background: "rgba(200,240,96,0.05)" }}>
              <span className="live-dot" />
              <span style={{ fontSize: 12, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}>
                {identity.reputationScore} pts
              </span>
            </div>
          )}
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{short}</span>
          <button className="btn-ghost" onClick={disconnect} style={{ fontSize: 11, padding: "7px 14px" }}>Exit</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 clamp(20px,5vw,48px)",
        display: "flex", gap: 0,
        position: "sticky", top: 64,
        background: "rgba(8,8,7,0.85)", backdropFilter: "blur(20px)",
        zIndex: 9,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "none", border: "none", cursor: "none",
              padding: "18px 24px 16px",
              fontSize: 11,
              fontFamily: "Syne, sans-serif",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: tab === t.id ? "var(--text)" : "var(--muted)",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 9, color: tab === t.id ? "var(--accent)" : "var(--muted)", fontWeight: 700 }}>{t.n}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ padding: "clamp(32px,5vw,56px) clamp(20px,5vw,48px)", maxWidth: 760, width: "100%" }}>
        {tab === "identity"    && <IdentityPanel address={address} identity={identity} loading={loading} txPending={txPending} register={register} refreshScore={refreshScore} />}
        {tab === "credentials" && <CredentialsPanel address={address} signer={signer} />}
        {tab === "loans"       && <LoansPanel address={address} signer={signer} identity={identity} />}
      </main>
    </div>
  );
}
