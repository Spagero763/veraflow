"use client";
import { useEffect } from "react";

const WALLETS = [
  { id: "core",     name: "Core Wallet",   desc: "Avalanche native wallet", letter: "C", color: "#e84142" },
  { id: "metamask", name: "MetaMask",       desc: "Most popular browser wallet", letter: "M", color: "#f6851b" },
  { id: "rabby",    name: "Rabby",          desc: "Multi-chain smart wallet", letter: "R", color: "#7b6ef6" },
  { id: "injected", name: "Browser Wallet", desc: "Any injected wallet", letter: "B", color: "var(--accent)" },
];

export default function WalletModal({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 50,
        animation: "fadeIn 0.2s ease both",
      }}
    >
      <div
        className="animate-fade-up"
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderBottom: "none",
          borderRadius: "12px 12px 0 0",
          width: "100%", maxWidth: 440,
          padding: "0 0 40px",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.5 }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 8px" }}>
          <div style={{ width: 36, height: 3, background: "var(--border-2)", borderRadius: 2 }} />
        </div>

        <div style={{ padding: "16px 28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <p style={{ fontFamily: "Clash Display, sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.03em" }}>Connect Wallet</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Choose your wallet to continue</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, lineHeight: 1, transition: "all 0.2s" }}
            >×</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            {WALLETS.map((w, i) => (
              <button
                key={w.id}
                onClick={() => onSelect(w.id)}
                className="animate-fade-up"
                style={{
                  background: "var(--surface)", border: "none", cursor: "none",
                  padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                  textAlign: "left", transition: "background 0.15s ease",
                  width: "100%", animationDelay: `${i * 0.05}s`,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: `${w.color}15`,
                  border: `1px solid ${w.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Clash Display, sans-serif", fontWeight: 700,
                  fontSize: 16, color: w.color, flexShrink: 0,
                }}>
                  {w.letter}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "Clash Display, sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{w.name}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{w.desc}</p>
                </div>
                <span style={{ color: "var(--muted)", fontSize: 16 }}>→</span>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 20 }}>
            Need a wallet?{" "}
            <a href="https://core.app" target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none" }}>Get Core →</a>
          </p>
        </div>
      </div>
    </div>
  );
}
