"use client";
import { useState } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { useWorkerIdentity } from "@/hooks/useWorkerIdentity";
import { FUJI_CHAIN_ID } from "@/lib/contracts";
import Dashboard from "@/components/Dashboard";
import RoleBanner from "@/components/RoleBanner";
import WalletModal from "@/components/WalletModal";

export default function Home() {
  const web3 = useWeb3();
  const { identity, loading, txPending, register, refreshScore } = useWorkerIdentity(web3.signer, web3.address);
  const [showModal, setShowModal] = useState(false);

  if (!web3.connected) return (
    <>
      <Landing onConnect={() => setShowModal(true)} connecting={web3.connecting} error={web3.error} />
      {showModal && <WalletModal onSelect={async id => { setShowModal(false); await web3.connect(id); }} onClose={() => setShowModal(false)} />}
    </>
  );

  if (web3.chainId !== FUJI_CHAIN_ID) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, textAlign: "center", padding: "24px 20px", position: "relative", zIndex: 2 }}>
      <p style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 800 }}>Wrong Network</p>
      <p style={{ color: "var(--muted)" }}>VeraFlow runs on Avalanche Fuji Testnet.</p>
      <button className="btn-primary" onClick={web3.switchToFuji}>Switch to Fuji →</button>
    </div>
  );

  return <>{web3.provider && <RoleBanner address={web3.address!} provider={web3.provider} />}<Dashboard address={web3.address!} identity={identity} loading={loading} txPending={txPending} register={register} refreshScore={refreshScore} signer={web3.signer} disconnect={web3.disconnect} /></>;
}

function Landing({ onConnect, connecting, error }: { onConnect: () => void; connecting: boolean; error: string | null }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr auto", position: "relative", zIndex: 2 }}>
      {/* Nav */}
      <nav style={{ padding: "20px clamp(20px, 5vw, 48px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(16px, 3vw, 20px)", letterSpacing: "-0.03em" }}>VeraFlow</span>
          <span className="desktop-only" style={{ fontSize: 10, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 2 }}>
            Worker Portal
          </span>
        </div>
        <button className="btn-primary" onClick={onConnect} disabled={connecting} style={{ padding: "12px 20px", fontSize: 12 }}>
          {connecting ? "···" : "Connect Wallet →"}
        </button>
      </nav>

      <main>
        {/* Hero */}
        <section style={{ padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 48px)", maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }} className="animate-fade-up">
            <span className="live-dot" />
            <span className="number-label">Live on Avalanche Fuji</span>
          </div>

          <h1 className="animate-fade-up animate-fade-up-1" style={{ fontSize: "clamp(48px, 10vw, 112px)", fontWeight: 800, lineHeight: 0.93, marginBottom: 36 }}>
            Your work.<br />
            Your proof.<br />
            <span style={{ color: "var(--accent)" }}>On-chain.</span>
          </h1>

          <p className="animate-fade-up animate-fade-up-2" style={{ color: "var(--muted)", fontSize: "clamp(14px, 2.5vw, 17px)", maxWidth: 480, lineHeight: 1.8, marginBottom: 48 }}>
            Build an on-chain professional identity. Collect verified credentials from institutions. Access credit based on your reputation — no bank, no collateral required.
          </p>

          <div className="animate-fade-up animate-fade-up-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={onConnect} disabled={connecting} style={{ fontSize: 13 }}>
              {connecting ? "Connecting···" : "Get Started →"}
            </button>
            <a href="#how-it-works" className="btn-ghost" style={{ textDecoration: "none", fontSize: 12 }}>
              How it works ↓
            </a>
          </div>

          {error && <p className="alert alert-error animate-fade-in" style={{ marginTop: 24, maxWidth: 420 }}>{error}</p>}
        </section>

        {/* Stats bar */}
        <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { value: "14", label: "Smart Contracts" },
              { value: "3", label: "Credential Types" },
              { value: "1000", label: "Max Score" },
              { value: "0", label: "Collateral Required" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", padding: "clamp(20px, 3vw, 28px) clamp(16px, 3vw, 24px)", textAlign: "center" }}>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 5vw, 40px)", color: "var(--accent)" }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" style={{ padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 48px)", maxWidth: 1000, margin: "0 auto" }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 20 }}>How It Works</p>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, marginBottom: "clamp(40px, 6vw, 64px)" }}>
            Four steps to financial access.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1, background: "var(--border)" }}>
            {[
              {
                n: "01",
                title: "Register Identity",
                desc: "Connect your wallet and register a decentralised identity (DID) on Avalanche. One address, one identity — immutable and yours.",
                action: "Takes 30 seconds",
              },
              {
                n: "02",
                title: "Earn Credentials",
                desc: "Verified institutions like universities and employers issue soulbound credential NFTs directly to your wallet. They can't be transferred or faked.",
                action: "Issued by institutions",
              },
              {
                n: "03",
                title: "Build Your Score",
                desc: "Your reputation score (0–1000) is computed from your credentials, account age, and loan history. Higher score = better credit tier.",
                action: "Score updates on-chain",
              },
              {
                n: "04",
                title: "Access Credit",
                desc: "With a score of 250+, borrow USDC against your reputation. No collateral. No bank. Repay on time to improve your score further.",
                action: "Score 250+ required",
              },
            ].map((step, i) => (
              <div key={step.n} className="card animate-fade-up" style={{ borderRadius: 0, animationDelay: `${i * 0.1}s`, display: "flex", flexDirection: "column", gap: 16 }}>
                <span className="number-label" style={{ color: "var(--accent)" }}>{step.n}</span>
                <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(16px, 2.5vw, 20px)" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, flex: 1 }}>{step.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
                  <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 600 }}>{step.action}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Who issues credentials */}
        <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 48px)", maxWidth: 1000, margin: "0 auto" }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 20 }}>Ecosystem</p>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, marginBottom: 16 }}>
            Three portals. One protocol.
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "clamp(13px, 2vw, 15px)", maxWidth: 520, lineHeight: 1.7, marginBottom: "clamp(32px, 5vw, 48px)" }}>
            VeraFlow connects workers, institutions, and employers in a single trustless protocol.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "var(--border)" }}>
            {[
              {
                role: "Workers",
                portal: "This portal",
                color: "var(--accent)",
                points: ["Register on-chain identity", "Receive soulbound credentials", "Build reputation score", "Borrow USDC without collateral"],
              },
              {
                role: "Institutions",
                portal: "Issuer Dashboard",
                color: "var(--warning)",
                points: ["Apply for verified status", "Issue credentials to workers", "Track issuance history", "Governed by VeraFlow council"],
              },
              {
                role: "Employers",
                portal: "Employer Portal",
                color: "#60a5fa",
                points: ["No wallet needed", "Search any wallet address", "View verified credentials", "See score + credit tier"],
              },
            ].map(p => (
              <div key={p.role} className="card" style={{ borderRadius: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(18px, 3vw, 22px)", color: p.color }}>{p.role}</p>
                  <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "Syne, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>{p.portal}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.points.map(pt => (
                    <div key={pt} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ color: p.color, fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 48px)", textAlign: "center" }}>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(32px, 6vw, 64px)", fontWeight: 800, marginBottom: 24 }}>
            Ready to build your<br />
            <span style={{ color: "var(--accent)" }}>on-chain reputation?</span>
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 40, lineHeight: 1.7 }}>
            Connect your wallet and register your identity in 30 seconds.
          </p>
          <button className="btn-primary" onClick={onConnect} disabled={connecting} style={{ fontSize: 14, padding: "16px 40px" }}>
            {connecting ? "Connecting···" : "Connect Wallet →"}
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: "20px clamp(20px, 5vw, 48px)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, position: "relative", zIndex: 2 }}>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em" }}>VERAFLOW · CHAIN ID 43113</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="https://veraflow-2uum.vercel.app" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em" }}>EMPLOYER PORTAL</a>
          <a href="https://veraflow-wz2r.vercel.app" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em" }}>ISSUER DASHBOARD</a>
        </div>
      </footer>
    </div>
  );
}
