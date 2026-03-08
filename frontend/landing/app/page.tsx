"use client";
import { useState, useEffect, useRef } from "react";

const WORKER_URL   = "https://veraflow-yarq.vercel.app";
const EMPLOYER_URL = "https://veraflow-2uum.vercel.app";
const ISSUER_URL   = "https://veraflow-wz2r.vercel.app";

const SECTION_STYLE: React.CSSProperties = {
  borderTop: "1px solid var(--border)",
  padding: "clamp(56px,10vw,112px) clamp(16px,4vw,48px)",
};
const INNER_STYLE: React.CSSProperties = {
  maxWidth: 1000,
  margin: "0 auto",
  width: "100%",
};

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
  const [activeFlow, setActiveFlow] = useState(0);

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
          {[{ label: "How it works", href: "#how" }, { label: "Portals", href: "#portals" }].map(l => (
            <a key={l.label} href={l.href} className="desktop-only" style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.2s", padding: "0 10px" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
            >{l.label}</a>
          ))}
          <a href={WORKER_URL} className="btn-primary" style={{ textDecoration: "none", padding: "9px 18px", fontSize: 12 }}>Launch App →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", padding: "clamp(16px,4vw,48px)" }}>
        <div style={{ ...INNER_STYLE, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 100, paddingBottom: 64 }}>
          <FadeUp style={{ marginBottom: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", border: "1px solid rgba(200,240,96,0.3)", borderRadius: 2, background: "rgba(200,240,96,0.05)" }}>
              <span className="live-dot" />
              <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "Syne, sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live on Avalanche Fuji</span>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h1 style={{ fontSize: "clamp(36px,6vw,80px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: 28 }}>
              Work is proof.<br />
              Proof is<br />
              <span style={{ color: "var(--accent)" }}>credit.</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.16}>
            <p style={{ fontSize: "clamp(14px,1.8vw,17px)", color: "var(--muted)", maxWidth: 500, lineHeight: 1.8, marginBottom: 36 }}>
              On-chain professional identity and reputation-based credit for workers locked out of the financial system. No bank. No collateral. No middleman.
            </p>
          </FadeUp>
          <FadeUp delay={0.24}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={WORKER_URL}   className="btn-primary" style={{ textDecoration: "none", fontSize: 13, padding: "14px 28px" }}>I am a Worker →</a>
              <a href={EMPLOYER_URL} className="btn-ghost"   style={{ textDecoration: "none", fontSize: 12 }}>I am an Employer</a>
              <a href={ISSUER_URL}   className="btn-ghost"   style={{ textDecoration: "none", fontSize: 12 }}>I am an Institution</a>
            </div>
          </FadeUp>
          <FadeUp delay={0.4} style={{ marginTop: 56 }}>
            <div style={{ display: "flex", gap: "clamp(20px,4vw,40px)", flexWrap: "wrap" }}>
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
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={SECTION_STYLE}>
        <div style={INNER_STYLE}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>The Problem</p>
            <h2 style={{ fontSize: "clamp(26px,4vw,52px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 40, letterSpacing: "-0.03em" }}>
              2 billion workers.<br />
              <span style={{ color: "var(--muted)", fontWeight: 300 }}>No financial identity.</span>
            </h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { n: "01", problem: "No credit history", detail: "Informal workers cannot prove income or work history to financial institutions." },
              { n: "02", problem: "Fake credentials", detail: "Paper certificates get forged. Institutions cannot verify education quickly." },
              { n: "03", problem: "Bank gatekeeping", detail: "Billions are locked out of credit without the right documents or relationships." },
            ].map((p, i) => (
              <FadeUp key={p.n} delay={i * 0.1}>
                <div className="card" style={{ borderRadius: 0 }}>
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
      <section id="how" style={SECTION_STYLE}>
        <div style={INNER_STYLE}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>How It Works</p>
            <h2 style={{ fontSize: "clamp(26px,4vw,52px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 12, letterSpacing: "-0.03em" }}>Three users. One protocol.</h2>
            <p style={{ fontSize: "clamp(13px,1.8vw,15px)", color: "var(--muted)", maxWidth: 460, lineHeight: 1.7, marginBottom: 40 }}>
              VeraFlow connects workers, institutions, and employers in a trustless loop.
            </p>
          </FadeUp>
          <div style={{ display: "flex", gap: 1, background: "var(--border)", marginBottom: 1 }}>
            {[
              { label: "Workers",      color: "var(--accent)" },
              { label: "Institutions", color: "var(--warning)" },
              { label: "Employers",    color: "#60a5fa" },
            ].map((f, i) => (
              <button key={f.label} onClick={() => setActiveFlow(i)} style={{
                flex: 1, background: activeFlow === i ? "var(--surface)" : "var(--bg)",
                border: "none", cursor: "pointer", padding: "clamp(12px,2vw,16px) 8px",
                fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "clamp(11px,1.8vw,13px)",
                color: activeFlow === i ? f.color : "var(--muted)",
                borderBottom: activeFlow === i ? `2px solid ${f.color}` : "2px solid transparent",
                transition: "all 0.2s ease",
              }}>{f.label}</button>
            ))}
          </div>
          {[
            {
              color: "var(--accent)", href: WORKER_URL, cta: "Open Worker Portal →",
              steps: [
                { n: "01", title: "Connect Wallet", body: "Connect MetaMask, Core, or any injected wallet. Works on mobile and desktop." },
                { n: "02", title: "Register Identity", body: "Create a decentralised identity on Avalanche Fuji. Immutable, portable, yours." },
                { n: "03", title: "Receive Credentials", body: "Verified institutions issue soulbound NFT credentials to your wallet. Cannot be transferred or faked." },
                { n: "04", title: "Borrow USDC", body: "Score 250+ unlocks credit. Borrow USDC with no collateral. Repay on time to grow your limit." },
              ],
            },
            {
              color: "var(--warning)", href: ISSUER_URL, cta: "Open Issuer Dashboard →",
              steps: [
                { n: "01", title: "Apply for Registry", body: "Submit your institution name and country for governance review." },
                { n: "02", title: "Get Approved", body: "Once approved, your institution is assigned a trust level: Verified or Premium." },
                { n: "03", title: "Issue Credentials", body: "Enter a worker wallet address and select the credential type. Issue on-chain in one transaction." },
                { n: "04", title: "Track Issuance", body: "Monitor total credentials issued and remaining daily limit from your dashboard." },
              ],
            },
            {
              color: "#60a5fa", href: EMPLOYER_URL, cta: "Open Employer Portal →",
              steps: [
                { n: "01", title: "No Wallet Needed", body: "The Employer Portal is read-only. No wallet connection required." },
                { n: "02", title: "Paste Wallet Address", body: "Enter any worker wallet address or use the share link they send you." },
                { n: "03", title: "Instant Verification", body: "See full credential portfolio, issuer trust levels, and reputation score breakdown." },
                { n: "04", title: "Make Decisions", body: "See credit eligibility, tier, and limit based on verified on-chain data." },
              ],
            },
          ].map((flow, fi) => (
            <div key={fi} style={{ display: activeFlow === fi ? "block" : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 1, background: "var(--border)" }}>
                {flow.steps.map((s, i) => (
                  <FadeUp key={s.n} delay={i * 0.08}>
                    <div className="card" style={{ borderRadius: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                      <span className="number-label" style={{ color: flow.color }}>{s.n}</span>
                      <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(14px,1.8vw,17px)" }}>{s.title}</p>
                      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, flex: 1 }}>{s.body}</p>
                    </div>
                  </FadeUp>
                ))}
                <FadeUp delay={flow.steps.length * 0.08}>
                  <div style={{ background: "var(--surface)", padding: 24, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 140 }}>
                    <a href={flow.href} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: flow.color, color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", padding: "13px 16px", borderRadius: 2, textDecoration: "none", transition: "opacity 0.2s" }}
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

      {/* PORTALS */}
      <section id="portals" style={SECTION_STYLE}>
        <div style={INNER_STYLE}>
          <FadeUp>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>The Portals</p>
            <h2 style={{ fontSize: "clamp(26px,4vw,52px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 40, letterSpacing: "-0.03em" }}>Pick your portal.</h2>
          </FadeUp>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 1, background: "var(--border)" }}>
            {[
              { role: "Workers", color: "var(--accent)", href: WORKER_URL, desc: "Register identity, collect soulbound credentials, and borrow USDC based on your reputation score.", features: ["On-chain DID registration", "Soulbound credential wallet", "Reputation score 0–1000", "USDC credit — no collateral"], cta: "Open Worker Portal" },
              { role: "Institutions", color: "var(--warning)", href: ISSUER_URL, desc: "Apply to become a verified issuer. Issue tamper-proof credentials directly to worker wallets.", features: ["Apply for verified status", "100–5,000 credentials/day", "Credential type selection", "Full issuance history"], cta: "Open Issuer Dashboard" },
              { role: "Employers", color: "#60a5fa", href: EMPLOYER_URL, desc: "No wallet needed. Paste any wallet address to instantly verify credentials and reputation score.", features: ["No wallet required", "Instant on-chain lookup", "Full credential breakdown", "Score + credit eligibility"], cta: "Open Employer Portal" },
            ].map((p, i) => (
              <FadeUp key={p.role} delay={i * 0.1}>
                <div style={{ background: "var(--surface)", padding: "clamp(20px,3vw,28px)", display: "flex", flexDirection: "column", gap: 18, height: "100%", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: p.color, opacity: 0.7 }} />
                  <div>
                    <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(20px,2.5vw,26px)", color: p.color, letterSpacing: "-0.02em", marginBottom: 12 }}>{p.role}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ color: p.color, fontSize: 11, flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <a href={p.href} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.color, color: "var(--bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", padding: "13px 16px", borderRadius: 2, textDecoration: "none", marginTop: "auto", transition: "opacity 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >{p.cta} →</a>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px clamp(16px,4vw,48px)" }}>
        <div style={{ ...INNER_STYLE, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>VeraFlow</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Worker Portal",    href: WORKER_URL },
              { label: "Employer Portal",  href: EMPLOYER_URL },
              { label: "Issuer Dashboard", href: ISSUER_URL },
            ].map(l => (
              <a key={l.label} href={l.href} style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
              >{l.label}</a>
            ))}
          </div>
          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "Syne, sans-serif" }}>CHAIN ID 43113 · AVALANCHE FUJI</span>
        </div>
      </footer>
    </div>
  );
}
