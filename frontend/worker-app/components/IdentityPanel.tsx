"use client";
import { useEffect, useState } from "react";
import { Identity } from "@/hooks/useWorkerIdentity";

function CountUp({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val}</>;
}

const STATUS = ["Unregistered", "Active", "Suspended", "Deactivated"];
const TIERS = [
  { score: 0,   label: "No Access",  color: "var(--muted)" },
  { score: 250, label: "$100 USDC",  color: "var(--accent)" },
  { score: 500, label: "$500 USDC",  color: "var(--accent)" },
  { score: 750, label: "$2,000 USDC", color: "var(--accent)" },
];

export default function IdentityPanel({ address, identity, loading, txPending, register, refreshScore }: {
  address: string; identity: Identity | null; loading: boolean; txPending: boolean;
  register: () => Promise<void>; refreshScore: () => Promise<void>;
}) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[120, 80, 100].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 3 }} />
      ))}
    </div>
  );

  if (!identity) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 560 }}>
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 20, color: "var(--accent)" }}>01 — Identity</p>
        <h2 style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.04em" }}>
          Register your<br />on-chain identity.
        </h2>
        <p style={{ color: "var(--muted)", marginTop: 20, lineHeight: 1.8, fontSize: 15, maxWidth: 420 }}>
          One address. One immutable identity. Your DID lives on Avalanche Fuji — portable, verifiable, yours forever.
        </p>
      </div>

      <div className="card-accent animate-fade-up animate-fade-up-1" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <span className="label">Your Wallet</span>
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-2)", wordBreak: "break-all", marginTop: 6, lineHeight: 1.7 }}>{address}</p>
        </div>
        <div className="divider" />
        <div>
          <span className="label">Decentralized ID (preview)</span>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            did:veraflow:43113:{address.toLowerCase().slice(2, 14)}···
          </p>
        </div>
      </div>

      <div className="animate-fade-up animate-fade-up-2">
        <button className="btn-primary" onClick={register} disabled={txPending} style={{ fontSize: 13 }}>
          {txPending ? <><span className="spinner" />Registering···</> : "Register Identity →"}
        </button>
      </div>
    </div>
  );

  const pct = Math.min((identity.reputationScore / 1000) * 100, 100);
  const date = new Date(identity.registeredAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const currentTier = TIERS.filter(t => identity.reputationScore >= t.score).pop()!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* Score hero */}
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 24, color: "var(--accent)" }}>01 — Identity</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{
              fontSize: "clamp(72px, 12vw, 112px)",
              fontWeight: 700,
              fontFamily: "Syne, sans-serif",
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: "var(--accent)",
            }}>
              <CountUp target={identity.reputationScore} />
            </span>
            <span style={{ fontSize: 20, color: "var(--muted)", fontWeight: 400, fontFamily: "DM Sans, sans-serif" }}>/1000</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <span className={`tag ${identity.status === 1 ? "tag-green" : "tag-dim"}`}>
              {STATUS[identity.status]}
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{currentTier.label} available</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Syne, sans-serif" }}>Reputation Score</p>
      </div>

      {/* Score bar with tiers */}
      <div className="animate-fade-up animate-fade-up-1">
        <div style={{ position: "relative", marginBottom: 16 }}>
          <div className="score-bar" style={{ height: 3 }}>
            <div className="score-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          {/* Tier markers */}
          {[250, 500, 750].map(s => (
            <div key={s} style={{
              position: "absolute", top: "50%", left: `${(s / 1000) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 8, height: 8, borderRadius: "50%",
              background: identity.reputationScore >= s ? "var(--accent)" : "var(--border-2)",
              border: "2px solid var(--bg)",
              transition: "background 0.5s ease",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {[{ s: 250, l: "$100" }, { s: 500, l: "$500" }, { s: 750, l: "$2k" }].map(t => (
            <div key={t.s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 11, fontFamily: "Syne, sans-serif", fontWeight: 600, color: identity.reputationScore >= t.s ? "var(--accent)" : "var(--muted)" }}>{t.s}+</span>
              <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="animate-fade-up animate-fade-up-2 stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[
          { label: "Credentials", value: String(identity.credentialCount) },
          { label: "Member Since", value: date },
          { label: "Status", value: STATUS[identity.status] },
        ].map(s => (
          <div key={s.label} className="stat-cell">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* DID */}
      <div className="card animate-fade-up animate-fade-up-3">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span className="label">Decentralized Identity Hash</span>
          <span className="tag tag-green">On-chain</span>
        </div>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)", wordBreak: "break-all", lineHeight: 1.8 }}>
          {identity.didHash}
        </p>
      </div>

      <div className="animate-fade-up animate-fade-up-4">
        <button className="btn-ghost" onClick={refreshScore} disabled={txPending}>
          {txPending ? <><span className="spinner" />Refreshing···</> : "↻  Refresh Score"}
        </button>
      </div>
    </div>
  );
}
