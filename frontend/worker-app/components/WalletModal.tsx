"use client";

const WALLETS = [
  { id: "core",     name: "Core Wallet",    icon: "🔺", desc: "Avalanche native" },
  { id: "metamask", name: "MetaMask",        icon: "🦊", desc: "Browser extension" },
  { id: "rabby",    name: "Rabby",           icon: "🐰", desc: "Multi-chain wallet" },
  { id: "injected", name: "Browser Wallet",  icon: "🌐", desc: "Any injected wallet" },
];

export default function WalletModal({ onSelect, onClose }: { onSelect: (id: string) => void; onClose: () => void }) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, padding: "0 0 0 0" }}
    >
      <div
        className="animate-fade-up"
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px 8px 0 0", width: "100%", maxWidth: 480, padding: "32px 24px 40px" }}
      >
        <div style={{ width: 40, height: 3, background: "var(--border)", borderRadius: 2, margin: "0 auto 28px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20 }}>Connect Wallet</p>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          {WALLETS.map(w => (
            <button
              key={w.id}
              onClick={() => onSelect(w.id)}
              style={{ background: "var(--surface)", border: "none", cursor: "pointer", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, textAlign: "left", transition: "background 0.15s ease", width: "100%", minHeight: 64 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a18")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{w.icon}</span>
              <div>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>{w.name}</p>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{w.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 20 }}>
          Get Core at{" "}
          <a href="https://core.app" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>core.app</a>
        </p>
      </div>
    </div>
  );
}
