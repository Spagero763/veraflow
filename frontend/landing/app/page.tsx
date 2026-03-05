"use client";
import { useState, useEffect, useRef } from "react";

const WORKER_URL = "https://veraflow-yarq-d9vbgyla2-spageros-projects.vercel.app";
const EMPLOYER_URL = "https://veraflow-2uum.vercel.app";
const ISSUER_URL = "https://veraflow-wz2r-c2j1pq4yl-spageros-projects.vercel.app";
const GITHUB_URL = "https://github.com/Spagero763/veraflow";
const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/1743015/veraflow-protocol/v0.0.1";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(32px)", transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function CountUp({ target, suffix = "", duration = 1500 }: { target: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeFlow, setActiveFlow] = useState(0);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 2, width: "100%" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 clamp(20px,5vw,56px)",
        height: 64,
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
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px,3vw,32px)" }}>
          {[
            { label: "How it works", href: "#how" },
            { label: "Portals", href: "#portals" },
            { label: "Tech", href: "#tech" },
          ].map(l => (
            <a key={l.label} href={l.href} className="desktop-only" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
            >{l.label}</a>
          ))}
          <a href={WORKER_URL} className="btn-primary" style={{ textDecoration: "none", padding: "10px 20px", fontSize: 12 }}>
            Launch App →
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
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
            <span style={{ color: "var(--accent)", WebkitTextStroke: "0px", position: "relative" }}>
              credit.
            </span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p style={{ fontSize: "clamp(15px,2.5vw,20px)", color: "var(--muted)", maxWidth: 560, lineHeight: 1.75, marginBottom: 48 }}>
            VeraFlow is an on-chain protocol that turns professional credentials into financial access — no bank, no collateral, no middleman.
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={WORKER_URL} className="btn-primary" style={{ textDecoration: "none", fontSize: 14, padding: "16px 36px" }}>
              I'm a Worker →
            </a>
            <a href={EMPLOYER_URL} className="btn-ghost" style={{ textDecoration: "none", fontSize: 13 }}>
              I'm an Employer
            </a>
            <a href={ISSUER_URL} className="btn-ghost" style={{ textDecoration: "none", fontSize: 13 }}>
              I'm an Institution
            </a>
          </div>
        </FadeUp>

        {/* Scroll hint */}
        <FadeUp delay={0.5} style={{ marginTop: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, var(--muted))" }} />
            <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll to explore</span>
          </div>
        </FadeUp>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 1, background: "var(--border)", maxWidth: "100%" }}>
          {[
            { value: 14, suffix: "", label: "Smart Contracts" },
            { value: 43, suffix: "/43", label: "Tests Passing" },
            { value: 1000, suffix: "", label: "Max Score" },
            { value: 0, suffix: "", label: "Collateral Required" },
          ].map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08}>
              <div style={{ background: "var(--surface)", padding: "clamp(24px,4vw,40px) clamp(20px,3vw,32px)", textAlign: "center" }}>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(36px,6vw,56px)", color: "var(--accent)", lineHeight: 1 }}>
                  <CountUp target={s.value} suffix={s.suffix} />
                </p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{ padding: "clamp(80px,12vw,140px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 24 }}>The Problem</p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h2 style={{ fontSize: "clamp(32px,6vw,72px)", fontWeight: 800, lineHeight: 1, marginBottom: 40 }}>
              2 billion workers.<br />
              <span style={{ color: "var(--muted)", fontWeight: 300 }}>No financial identity.</span>
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { n: "01", problem: "No credit history", detail: "Informal workers can't prove income or work history to traditional financial institutions." },
              { n: "02", problem: "Fake credentials", detail: "Paper certificates are forged. Institutions can't verify education or employment quickly." },
              { n: "03", problem: "Bank gatekeeping", detail: "Billions of people are locked out of credit because they lack the right documents or relationships." },
            ].map((p, i) => (
              <FadeUp key={p.n} delay={i * 0.1}>
                <div className="card" style={{ borderRadius: 0, minHeight: 180 }}>
                  <span className="number-label" style={{ color: "var(--accent)", display: "block", marginBottom: 16 }}>{p.n}</span>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(18px,2.5vw,22px)", marginBottom: 12 }}>{p.problem}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{p.detail}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ borderTop: "1px solid var(--border)", padding: "clamp(80px,12vw,140px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 24 }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(32px,6vw,72px)", fontWeight: 800, lineHeight: 1, marginBottom: 16 }}>Three users. One protocol.</h2>
            <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "var(--muted)", maxWidth: 520, lineHeight: 1.7, marginBottom: 64 }}>
              VeraFlow connects workers, institutions, and employers in a trustless loop.
            </p>
          </FadeUp>

          {/* Flow selector */}
          <div style={{ display: "flex", gap: 1, background: "var(--border)", marginBottom: 1 }}>
            {[
              { label: "Workers", color: "var(--accent)" },
              { label: "Institutions", color: "var(--warning)" },
              { label: "Employers", color: "#60a5fa" },
            ].map((f, i) => (
              <button key={f.label} onClick={() => setActiveFlow(i)} style={{
                flex: 1, background: activeFlow === i ? "var(--surface)" : "var(--bg)",
                border: "none", cursor: "pointer", padding: "clamp(16px,2vw,20px) 16px",
                fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "clamp(12px,2vw,14px)",
                color: activeFlow === i ? f.color : "var(--muted)",
                borderBottom: activeFlow === i ? `2px solid ${f.color}` : "2px solid transparent",
                transition: "all 0.2s ease",
              }}>{f.label}</button>
            ))}
          </div>

          {/* Flow content */}
          {[
            {
              color: "var(--accent)",
              cta: "Open Worker Portal →",
              href: WORKER_URL,
              steps: [
                { n: "01", title: "Connect Wallet", body: "Connect MetaMask, Core, or any injected wallet. Works on mobile and desktop." },
                { n: "02", title: "Register Identity", body: "Create a decentralised identity (DID) on Avalanche Fuji. Immutable, portable, yours." },
                { n: "03", title: "Receive Credentials", body: "Verified institutions issue soulbound NFT credentials directly to your wallet. Can't be transferred or faked." },
                { n: "04", title: "Build Your Score", body: "Your reputation score (0–1000) is computed on-chain from credentials, account age, and loan repayment history." },
                { n: "05", title: "Borrow USDC", body: "Score ≥ 250 unlocks a credit limit. Borrow USDC with no collateral. Repay on time to grow your limit." },
              ],
            },
            {
              color: "var(--warning)",
              cta: "Open Issuer Dashboard →",
              href: ISSUER_URL,
              steps: [
                { n: "01", title: "Apply for Registry", body: "Submit your institution name and country. Applications are reviewed by the VeraFlow governance council." },
                { n: "02", title: "Get Approved", body: "Once approved, your institution is assigned a trust level: Pending, Verified, or Premium." },
                { n: "03", title: "Issue Credentials", body: "Enter a worker's wallet address and select the credential type. Issue it on-chain in one transaction." },
                { n: "04", title: "Track Issuance", body: "Monitor total credentials issued and remaining daily limit from your dashboard." },
              ],
            },
            {
              color: "#60a5fa",
              cta: "Open Employer Portal →",
              href: EMPLOYER_URL,
              steps: [
                { n: "01", title: "No Wallet Needed", body: "The Employer Portal is read-only. No wallet connection required." },
                { n: "02", title: "Paste Wallet Address", body: "Enter any worker's wallet address or use the share link they send you." },
                { n: "03", title: "Instant Verification", body: "See their full credential portfolio, issuer trust levels, and reputation score breakdown in seconds." },
                { n: "04", title: "Make Decisions", body: "See credit eligibility, tier, and limit. Use verified on-chain data for hiring or contracting decisions." },
              ],
            },
          ].map((flow, fi) => (
            <div key={fi} style={{ display: activeFlow === fi ? "block" : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 1, background: "var(--border)" }}>
                {flow.steps.map((s, i) => (
                  <FadeUp key={s.n} delay={i * 0.08}>
                    <div className="card" style={{ borderRadius: 0, minHeight: 180, display: "flex", flexDirection: "column", gap: 12 }}>
                      <span className="number-label" style={{ color: flow.color }}>{s.n}</span>
                      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(15px,2vw,18px)" }}>{s.title}</p>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, flex: 1 }}>{s.body}</p>
                    </div>
                  </FadeUp>
                ))}
                {/* CTA card */}
                <FadeUp delay={flow.steps.length * 0.08}>
                  <div style={{ background: flow.color === "var(--accent)" ? "rgba(200,240,96,0.06)" : flow.color === "var(--warning)" ? "rgba(245,166,35,0.06)" : "rgba(96,165,250,0.06)", border: `1px solid ${flow.color === "var(--accent)" ? "rgba(200,240,96,0.2)" : flow.color === "var(--warning)" ? "rgba(245,166,35,0.2)" : "rgba(96,165,250,0.2)"}`, padding: 28, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 180 }}>
                    <a href={flow.href} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: flow.color, color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", padding: "14px 24px", borderRadius: 2, textDecoration: "none", transition: "opacity 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >{flow.cta}</a>
                  </div>
                </FadeUp>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section id="portals" style={{ borderTop: "1px solid var(--border)", padding: "clamp(80px,12vw,140px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 24 }}>The Portals</p>
            <h2 style={{ fontSize: "clamp(32px,6vw,72px)", fontWeight: 800, lineHeight: 1, marginBottom: 64 }}>
              Pick your portal.
            </h2>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              {
                role: "Workers",
                tag: "Identity + Credit",
                color: "var(--accent)",
                href: WORKER_URL,
                desc: "Register your on-chain identity, collect soulbound credentials, and access credit based on your reputation.",
                features: ["On-chain DID registration", "Soulbound credential wallet", "Reputation score 0–1000", "USDC credit — no collateral"],
                cta: "Open Worker Portal",
              },
              {
                role: "Institutions",
                tag: "Issue Credentials",
                color: "var(--warning)",
                href: ISSUER_URL,
                desc: "Apply to become a verified issuer. Issue tamper-proof soulbound credentials directly to worker wallets.",
                features: ["Apply for verified status", "100 credentials/day limit", "Credential type selection", "Full issuance history"],
                cta: "Open Issuer Dashboard",
              },
              {
                role: "Employers",
                tag: "Verify Instantly",
                color: "#60a5fa",
                href: EMPLOYER_URL,
                desc: "No wallet needed. Paste any wallet address to instantly verify credentials and reputation score.",
                features: ["No wallet required", "Instant on-chain lookup", "Full credential breakdown", "Score + credit eligibility"],
                cta: "Open Employer Portal",
              },
            ].map((p, i) => (
              <FadeUp key={p.role} delay={i * 0.1}>
                <div style={{ background: "var(--surface)", padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: 20, height: "100%", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: p.color, opacity: 0.6 }} />
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(22px,3vw,28px)", color: p.color }}>{p.role}</p>
                      <span style={{ fontSize: 10, color: p.color, fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", border: `1px solid ${p.color}`, borderRadius: 2, opacity: 0.7 }}>{p.tag}</span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: p.color, fontSize: 12, flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <a href={p.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.color, color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", padding: "14px 24px", borderRadius: 2, textDecoration: "none", transition: "opacity 0.2s", marginTop: "auto" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >{p.cta} →</a>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section id="tech" style={{ borderTop: "1px solid var(--border)", padding: "clamp(80px,12vw,140px) clamp(20px,5vw,56px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 24 }}>Built on</p>
            <h2 style={{ fontSize: "clamp(32px,6vw,72px)", fontWeight: 800, lineHeight: 1, marginBottom: 16 }}>
              Production-grade<br />infrastructure.
            </h2>
            <p style={{ fontSize: "clamp(14px,2vw,16px)", color: "var(--muted)", maxWidth: 480, lineHeight: 1.7, marginBottom: 64 }}>
              Every component is on-chain, verifiable, and open source.
            </p>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { tech: "Avalanche Fuji", role: "L1 Blockchain", detail: "Fast finality, low fees, EVM-compatible. All contracts deployed and verified on Fuji testnet.", badge: "Chain ID 43113" },
              { tech: "Solidity + Foundry", role: "Smart Contracts", detail: "14 contracts, 43 tests, 100% passing. Fully verified on Snowtrace.", badge: "43/43 Tests" },
              { tech: "Soulbound NFTs", role: "Credentials (ERC-721S)", detail: "Non-transferable credential tokens. Issued directly by verified institutions. Revocable by issuer.", badge: "EIP-5192" },
              { tech: "The Graph", role: "Indexing", detail: "Subgraph deployed and indexing all credential issuance and identity events from block 38,000,000.", badge: "Live Subgraph" },
              { tech: "Next.js 16", role: "Frontend", detail: "Three separate portals — Worker, Employer, Issuer — all responsive and deployed to Vercel.", badge: "3 Portals" },
              { tech: "Ethers.js v6", role: "Web3 Layer", detail: "Wallet connection, contract calls, transaction signing. Supports MetaMask, Core, and Rabby.", badge: "v6" },
            ].map((t, i) => (
              <FadeUp key={t.tech} delay={i * 0.06}>
                <div className="card" style={{ borderRadius: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(16px,2vw,20px)" }}>{t.tech}</p>
                    <span style={{ fontSize: 9, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(200,240,96,0.3)", borderRadius: 2, whiteSpace: "nowrap", marginLeft: 8 }}>{t.badge}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.role}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{t.detail}</p>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Contract addresses for judges */}
          <FadeUp delay={0.2} style={{ marginTop: 1 }}>
            <div className="card-accent" style={{ borderRadius: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
                <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18 }}>Contract Addresses</p>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Avalanche Fuji · All verified on Snowtrace</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
                {[
                  { name: "WorkerIdentity", addr: "0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766" },
                  { name: "ReputationScore", addr: "0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a" },
                  { name: "CredentialNFT", addr: "0xdc7041742002F70ec635015b2e10FE52dD406A3D" },
                  { name: "CredentialRegistry", addr: "0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad" },
                  { name: "LendingPool", addr: "0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc" },
                  { name: "CollateralOracle", addr: "0xD35374e2621f16580eb093B9792773E34cAbA76a" },
                ].map(c => (
                  <div key={c.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 600, flexShrink: 0 }}>{c.name}</span>
                    <a href={`https://testnet.snowtrace.io/address/${c.addr}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
                    >{c.addr.slice(0,10)}···{c.addr.slice(-6)} ↗</a>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <a href={GITHUB_URL} className="btn-ghost" style={{ textDecoration: "none", fontSize: 12 }}>GitHub →</a>
                <a href={SUBGRAPH_URL} className="btn-ghost" style={{ textDecoration: "none", fontSize: 12 }}>Subgraph →</a>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: "1px solid var(--border)", padding: "clamp(80px,12vw,140px) clamp(20px,5vw,56px)", textAlign: "center" }}>
        <FadeUp>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 24 }}>Get Started</p>
          <h2 style={{ fontSize: "clamp(36px,8vw,100px)", fontWeight: 800, lineHeight: 0.93, marginBottom: 32 }}>
            Your reputation<br />
            <span style={{ color: "var(--accent)" }}>starts now.</span>
          </h2>
          <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "var(--muted)", maxWidth: 440, margin: "0 auto 48px", lineHeight: 1.7 }}>
            Connect your wallet on the Worker Portal and register your identity in under a minute.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={WORKER_URL} className="btn-primary" style={{ textDecoration: "none", fontSize: 14, padding: "18px 44px" }}>
              Launch Worker Portal →
            </a>
            <a href={GITHUB_URL} className="btn-ghost" style={{ textDecoration: "none", fontSize: 13 }}>
              View Source Code
            </a>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px clamp(20px,5vw,56px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16 }}>VeraFlow</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Build Games 2026</span>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Worker Portal", href: WORKER_URL },
            { label: "Employer Portal", href: EMPLOYER_URL },
            { label: "Issuer Dashboard", href: ISSUER_URL },
            { label: "GitHub", href: GITHUB_URL },
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
