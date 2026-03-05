"use client";
import { useEffect, useState } from "react";
import { Identity } from "@/hooks/useWorkerIdentity";

type Props = {
  address: string;
  identity: Identity | null;
  loading: boolean;
  txPending: boolean;
  register: () => Promise<void>;
  refreshScore: () => Promise<void>;
};

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <>{val}</>;
}

const STATUS = ["Unregistered", "Active", "Suspended", "Deactivated"];

export default function IdentityPanel({ address, identity, loading, txPending, register, refreshScore }: Props) {
  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 100, background: "var(--surface)", borderRadius: 2, opacity: 0.6 + i * 0.1 }} />
      ))}
    </div>
  );

  if (!identity) return (
    <div className="animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: 40, maxWidth: 560 }}>
      <div>
        <p className="number-label" style={{ marginBottom: 16, color: "var(--accent)" }}>01 — Identity</p>
        <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800 }}>
          Register your<br />on-chain identity.
        </h2>
        <p style={{ color: "var(--muted)", marginTop: 16, lineHeight: 1.8, maxWidth: 400 }}>
          One address. One identity. Your DID lives on Avalanche Fuji — immutable, portable, yours.
        </p>
      </div>

      <div className="card-accent" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <span className="label">Wallet Address</span>
          <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text)", wordBreak: "break-all", marginTop: 4 }}>{address}</p>
        </div>
        <div className="divider" />
        <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>
          did:veraflow:43113:{address.toLowerCase().slice(0, 20)}···
        </p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={register} disabled={txPending}>
          {txPending ? "Registering..." : "Register Identity →"}
        </button>
      </div>
    </div>
  );

  const pct = (identity.reputationScore / 1000) * 100;
  const date = new Date(identity.registeredAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* Header */}
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 16, color: "var(--accent)" }}>01 — Identity</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: "clamp(64px, 10vw, 96px)", fontWeight: 800, fontFamily: "Syne, sans-serif", lineHeight: 1, color: "var(--accent)" }}>
              <CountUp target={identity.reputationScore} />
            </span>
            <span style={{ fontSize: 18, color: "var(--muted)", fontWeight: 300 }}>/1000</span>
          </div>
          <span className={`tag ${identity.status === 1 ? "tag-green" : "tag-dim"}`}>
            <span className="live-dot" style={{ marginRight: 6 }} />
            {STATUS[identity.status]}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Reputation Score</p>
      </div>

      {/* Score bar */}
      <div className="animate-fade-up animate-fade-up-1">
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          {[{ label: "Tier 0", score: 250 }, { label: "Tier 1", score: 500 }, { label: "Tier 2", score: 750 }].map(t => (
            <div key={t.label} style={{ display: "flex", flexDirection: "column", alignItems: t.label === "Tier 1" ? "center" : t.label === "Tier 2" ? "flex-end" : "flex-start", gap: 2 }}>
              <span style={{ fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 700, color: identity.reputationScore >= t.score ? "var(--accent)" : "var(--muted)" }}>
                {t.score}+
              </span>
              <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="animate-fade-up animate-fade-up-2 stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[
          { label: "Credentials", value: String(identity.credentialCount) },
          { label: "Since", value: date },
          { label: "Status", value: STATUS[identity.status] },
        ].map(s => (
          <div key={s.label} className="stat-cell">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* DID card */}
      <div className="card animate-fade-up animate-fade-up-3">
        <span className="label">DID Hash</span>
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)", wordBreak: "break-all", marginTop: 8, lineHeight: 1.8 }}>
          {identity.didHash}
        </p>
      </div>

      <div className="animate-fade-up animate-fade-up-4">
        <button className="btn-ghost" onClick={refreshScore} disabled={txPending}>
          {txPending ? "Refreshing..." : "↻ Refresh Score"}
        </button>
      </div>
    </div>
  );
}
