"use client";
import { useState, useEffect, useRef } from "react";

const WORKER_URL  = "https://veraflow-yarq.vercel.app";
const EMPLOYER_URL = "https://veraflow-2uum.vercel.app";
const ISSUER_URL  = "https://veraflow-wz2r.vercel.app";
const GITHUB_URL  = "https://github.com/Spagero763/veraflow";
const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/1743015/veraflow-protocol/v0.0.1";

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 2, width: "100%" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 clamp(20px,5vw,56px)", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: navScrolled ? "1px solid var(--border)" : "1px solid transparent",
        background: navScrolled ? "rgba(8,8,7,0.92)" : "transparent",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>VeraFlow</span>
          <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 2 }}>Protocol</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: "none", fontSize: 11, padding: "8px 14px" }}>GitHub →</a>
          <a href={WORKER_URL} className="btn-primary" style={{ textDecoration: "none", padding: "10px 20px", fontSize: 12 }}>Launch App →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px clamp(20px,5vw,56px) 80px" }}>
        <FadeUp style={{ marginBottom: 24 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", border: "1px solid rgba(200,240,96,0.3)", borderRadius: 2, background: "rgba(200,240,96,0.05)" }}>
            <span className="live-dot" />
            <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live on Avalanche Fuji</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1 style={{ fontSize: "clamp(52px,11vw,140px)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: 40, maxWidth: 1100 }}>
            Work is proof.<br />
            Proof is<br />
            <span style={{ color: "var(--accent)" }}>credit.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p style={{ fontSize: "clamp(15px,2.5vw,20px)", color: "var(--muted)", maxWidth: 520, lineHeight: 1.75, marginBottom: 48 }}>
            On-chain professional identity and reputation-based credit for workers locked out of the financial system. No bank. No collateral. No middleman.
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={WORKER_URL}  className="btn-primary" style={{ textDecoration: "none", fontSize: 14, padding: "16px 36px" }}>I am a Worker →</a>
            <a href={EMPLOYER_URL} className="btn-ghost"  style={{ textDecoration: "none", fontSize: 13 }}>I am an Employer</a>
            <a href={ISSUER_URL}  className="btn-ghost"  style={{ textDecoration: "none", fontSize: 13 }}>I am an Institution</a>
          </div>
        </FadeUp>
      </section>

      {/* PORTALS */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(64px,10vw,120px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Three portals. One protocol.</p>
            <h2 style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: 800, lineHeight: 1, marginBottom: 56, letterSpacing: "-0.03em" }}>
              Pick your role.
            </h2>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              {
                role: "Workers",
                color: "var(--accent)",
                href: WORKER_URL,
                desc: "Register your on-chain identity, collect soulbound credentials from institutions, and borrow USDC based on your reputation score.",
                cta: "Open Worker Portal",
              },
              {
                role: "Institutions",
                color: "var(--warning)",
                href: ISSUER_URL,
                desc: "Apply to become a verified issuer. Issue tamper-proof soulbound credentials directly to worker wallets in one transaction.",
                cta: "Open Issuer Dashboard",
              },
              {
                role: "Employers",
                color: "#60a5fa",
                href: EMPLOYER_URL,
                desc: "No wallet needed. Paste any wallet address to instantly verify credentials, reputation score, and credit eligibility on-chain.",
                cta: "Open Employer Portal",
              },
            ].map((p, i) => (
              <FadeUp key={p.role} delay={i * 0.1}>
                <div style={{ background: "var(--surface)", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: 24, height: "100%", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: p.color, opacity: 0.7 }} />
                  <div>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(24px,3vw,32px)", color: p.color, marginBottom: 16, letterSpacing: "-0.03em" }}>{p.role}</p>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75 }}>{p.desc}</p>
                  </div>
                  <a href={p.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.color, color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", padding: "14px 24px", borderRadius: 2, textDecoration: "none", marginTop: "auto", transition: "opacity 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >{p.cta} →</a>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CONTRACTS */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(64px,10vw,120px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
              <div>
                <p className="number-label" style={{ color: "var(--accent)", marginBottom: 12 }}>On-chain</p>
                <h2 style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>Contract Addresses</h2>
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>Avalanche Fuji · 14 contracts · 43/43 tests passing · All verified on Snowtrace</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={GITHUB_URL} className="btn-ghost" target="_blank" rel="noreferrer" style={{ textDecoration: "none", fontSize: 12 }}>GitHub →</a>
                <a href={SUBGRAPH_URL} className="btn-ghost" target="_blank" rel="noreferrer" style={{ textDecoration: "none", fontSize: 12 }}>Subgraph →</a>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
              {[
                { name: "WorkerIdentity",     addr: "0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766" },
                { name: "ReputationScore",    addr: "0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a" },
                { name: "CredentialNFT",      addr: "0xdc7041742002F70ec635015b2e10FE52dD406A3D" },
                { name: "CredentialRegistry", addr: "0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad" },
                { name: "LendingPool",        addr: "0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc" },
                { name: "CollateralOracle",   addr: "0xD35374e2621f16580eb093B9792773E34cAbA76a" },
              ].map(c => (
                <div key={c.name} style={{ background: "var(--surface)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{c.name}</span>
                  <a href={`https://testnet.snowtrace.io/address/${c.addr}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                  >{c.addr} ↗</a>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px clamp(20px,5vw,56px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16 }}>VeraFlow</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Build Games 2026</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Worker Portal",    href: WORKER_URL },
            { label: "Employer Portal",  href: EMPLOYER_URL },
            { label: "Issuer Dashboard", href: ISSUER_URL },
            { label: "GitHub",           href: GITHUB_URL },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
            >{l.label}</a>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Syne, sans-serif" }}>CHAIN ID 43113 · AVALANCHE FUJI</span>
      </footer>
    </div>
  );
}
