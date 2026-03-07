"use client";
import { useState, useEffect, useRef } from "react";

const WORKER_URL   = "https://veraflow-yarq.vercel.app";
const EMPLOYER_URL = "https://veraflow-2uum.vercel.app";
const ISSUER_URL   = "https://veraflow-wz2r.vercel.app";
const GITHUB_URL   = "https://github.com/Spagero763/veraflow";
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
    <div style={{ position: "relative", zIndex: 2, width: "100%", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 clamp(16px,4vw,48px)", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: navScrolled ? "1px solid var(--border)" : "1px solid transparent",
        background: navScrolled ? "rgba(8,8,7,0.95)" : "transparent",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>VeraFlow</span>
          <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 2 }}>Protocol</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="btn-ghost desktop-only" style={{ textDecoration: "none", fontSize: 11, padding: "7px 12px" }}>GitHub →</a>
          <a href={WORKER_URL} className="btn-primary" style={{ textDecoration: "none", padding: "9px 18px", fontSize: 12 }}>Launch App →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "100px clamp(16px,4vw,48px) 64px" }}>
        <FadeUp style={{ marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", border: "1px solid rgba(200,240,96,0.3)", borderRadius: 2, background: "rgba(200,240,96,0.05)" }}>
            <span className="live-dot" />
            <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live on Avalanche Fuji</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1 style={{ fontSize: "clamp(40px,8vw,96px)", fontWeight: 800, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: 32, maxWidth: 900 }}>
            Work is proof.<br />
            Proof is<br />
            <span style={{ color: "var(--accent)" }}>credit.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p style={{ fontSize: "clamp(14px,2vw,18px)", color: "var(--muted)", maxWidth: 500, lineHeight: 1.8, marginBottom: 40 }}>
            On-chain professional identity and reputation-based credit for 2 billion informal workers locked out of the financial system. No bank. No collateral. No middleman.
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={WORKER_URL}   className="btn-primary" style={{ textDecoration: "none", fontSize: 13, padding: "14px 28px" }}>I am a Worker →</a>
            <a href={EMPLOYER_URL} className="btn-ghost"   style={{ textDecoration: "none", fontSize: 12 }}>I am an Employer</a>
            <a href={ISSUER_URL}   className="btn-ghost"   style={{ textDecoration: "none", fontSize: 12 }}>I am an Institution</a>
          </div>
        </FadeUp>

        <FadeUp delay={0.4} style={{ marginTop: 64 }}>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { value: "14", label: "Smart Contracts" },
              { value: "43/43", label: "Tests Passing" },
              { value: "1000", label: "Max Score" },
              { value: "$0", label: "Collateral" },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(20px,3vw,28px)", color: "var(--accent)", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </FadeUp>
      </section>

      {/* THE PROBLEM */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(56px,10vw,112px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>The Problem</p>
            <h2 style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 48, letterSpacing: "-0.03em" }}>
              2 billion workers.<br />
              <span style={{ color: "var(--muted)", fontWeight: 300 }}>No financial identity.</span>
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { n: "01", problem: "No credit history", detail: "Informal workers can't prove income or work history to financial institutions." },
              { n: "02", problem: "Fake credentials", detail: "Paper certificates get forged. Institutions can't verify education quickly." },
              { n: "03", problem: "Bank gatekeeping", detail: "Billions are locked out of credit without the right documents or relationships." },
            ].map((p, i) => (
              <FadeUp key={p.n} delay={i * 0.1}>
                <div className="card" style={{ borderRadius: 0, minHeight: 160 }}>
                  <span className="number-label" style={{ color: "var(--accent)", display: "block", marginBottom: 14 }}>{p.n}</span>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(16px,2vw,20px)", marginBottom: 10 }}>{p.problem}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{p.detail}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(56px,10vw,112px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 48, letterSpacing: "-0.03em" }}>
              Three users. One protocol.
            </h2>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
            {[
              {
                role: "Workers", color: "var(--accent)", href: WORKER_URL,
                steps: ["Connect wallet and register on-chain identity (DID)", "Receive soulbound credential NFTs from verified institutions", "Build reputation score 0–1000 from credentials + history", "Borrow USDC at 250+ score — no collateral required"],
              },
              {
                role: "Institutions", color: "var(--warning)", href: ISSUER_URL,
                steps: ["Apply for verified issuer status via the Issuer Dashboard", "Get approved by the VeraFlow governance council", "Issue tamper-proof credentials to worker wallets on-chain", "Track issuance history and daily limits from your dashboard"],
              },
              {
                role: "Employers", color: "#60a5fa", href: EMPLOYER_URL,
                steps: ["Open the Employer Portal — no wallet needed", "Paste any worker's wallet address or use their share link", "See full credential portfolio, issuer trust level, and score", "Make hiring or contracting decisions based on verified data"],
              },
            ].map((flow, fi) => (
              <FadeUp key={flow.role} delay={fi * 0.1}>
                <div style={{ background: "var(--surface)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(18px,2.5vw,24px)", color: flow.color }}>{flow.role}</p>
                    <a href={flow.href} style={{ fontSize: 12, color: flow.color, fontFamily: "Syne, sans-serif", fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>Open Portal →</a>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
                    {flow.steps.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 10, color: flow.color, flexShrink: 0, marginTop: 3, letterSpacing: "0.1em" }}>0{i+1}</span>
                        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* PORTALS */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(56px,10vw,112px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Try it now</p>
            <h2 style={{ fontSize: "clamp(28px,5vw,56px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 48, letterSpacing: "-0.03em" }}>Pick your role.</h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { role: "Workers", color: "var(--accent)", href: WORKER_URL, desc: "Register identity, collect credentials, borrow USDC — all on-chain.", cta: "Open Worker Portal" },
              { role: "Institutions", color: "var(--warning)", href: ISSUER_URL, desc: "Apply to issue tamper-proof soulbound credentials to worker wallets.", cta: "Open Issuer Dashboard" },
              { role: "Employers", color: "#60a5fa", href: EMPLOYER_URL, desc: "No wallet needed. Instantly verify any worker's credentials on-chain.", cta: "Open Employer Portal" },
            ].map((p, i) => (
              <FadeUp key={p.role} delay={i * 0.1}>
                <div style={{ background: "var(--surface)", padding: "clamp(20px,3vw,32px)", display: "flex", flexDirection: "column", gap: 20, height: "100%", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: p.color, opacity: 0.7 }} />
                  <div>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", color: p.color, marginBottom: 12, letterSpacing: "-0.02em" }}>{p.role}</p>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                  <a href={p.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.color, color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", padding: "13px 20px", borderRadius: 2, textDecoration: "none", marginTop: "auto", transition: "opacity 0.2s" }}
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
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(56px,10vw,112px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
              <div>
                <p className="number-label" style={{ color: "var(--accent)", marginBottom: 12 }}>On-chain</p>
                <h2 style={{ fontSize: "clamp(24px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em" }}>Contract Addresses</h2>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Avalanche Fuji · 14 contracts · 43/43 tests · All verified on Snowtrace</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={GITHUB_URL} className="btn-ghost" target="_blank" rel="noreferrer" style={{ textDecoration: "none", fontSize: 11 }}>GitHub →</a>
                <a href={SUBGRAPH_URL} className="btn-ghost" target="_blank" rel="noreferrer" style={{ textDecoration: "none", fontSize: 11 }}>Subgraph →</a>
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
                <div key={c.name} style={{ background: "var(--surface)", padding: "14px clamp(16px,3vw,24px)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 700, flexShrink: 0 }}>{c.name}</span>
                  <a href={`https://testnet.snowtrace.io/address/${c.addr}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", textDecoration: "none", transition: "color 0.2s", wordBreak: "break-all" }}
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
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px clamp(16px,4vw,48px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 15 }}>VeraFlow</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Build Games 2026</span>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
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
        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "Syne, sans-serif" }}>CHAIN ID 43113 · AVALANCHE FUJI</span>
      </footer>
    </div>
  );
}
