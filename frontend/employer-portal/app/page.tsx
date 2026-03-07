"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useVerification } from "@/hooks/useVerification";
import { TRUST_LEVELS, CREDENTIAL_TYPES } from "@/lib/contracts";

const USDC = (amount: bigint) => (Number(amount) / 1e6).toFixed(2);

function VerifyPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const { profile, loading, error, verify } = useVerification();

  useEffect(() => {
    const addr = searchParams.get("address");
    if (addr) { setInput(addr); verify(addr); }
  }, [searchParams]);

  const handleVerify = () => { const a = input.trim(); if (a) verify(a); };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      {/* Nav */}
      <nav style={{ padding: "20px clamp(20px, 5vw, 48px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(15px, 3vw, 18px)", letterSpacing: "-0.03em" }}>VeraFlow</span>
          <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 2 }}>Employer</span>
        </div>
        <a href="https://veraflow-yarq.vercel.app" style={{ fontSize: 11, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none" }}>
          Worker Portal
        </a>
      </nav>

      <main style={{ padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 48px)", maxWidth: 860, width: "100%", margin: "0 auto", position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: "clamp(32px, 5vw, 48px)" }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Verification Portal</p>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 64px)", fontWeight: 800, lineHeight: 0.95, marginBottom: 16 }}>
            Verify any<br />worker's credentials.
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "clamp(13px, 2vw, 15px)", lineHeight: 1.7 }}>
            On-chain verification. No third parties. No forgery. Paste any wallet address to instantly see verified credentials and reputation score.
          </p>
        </div>

        {/* Search */}
        <div className="animate-fade-up animate-fade-up-1" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder="Paste wallet address 0x..."
              style={{ fontFamily: "monospace", fontSize: 13 }}
            />
            <button className="btn-primary" onClick={handleVerify} disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>
              {loading ? "···" : "Verify →"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Workers can share their verification link from the Worker Portal.
          </p>
        </div>

        {error && <p className="alert alert-error animate-fade-in" style={{ marginBottom: 32 }}>{error}</p>}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
            {[120, 100, 160].map((h, i) => (
              <div key={i} style={{ height: h, background: "var(--surface)", borderRadius: 2, opacity: 0.4 + i * 0.2 }} />
            ))}
          </div>
        )}

        {!profile && !loading && !error && (
          <div style={{ marginTop: 48 }}>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 20 }}>What you can verify</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: "var(--border)" }}>
              {[
                { icon: "🎓", label: "Degrees & Certifications", desc: "Issued by verified universities and training bodies" },
                { icon: "💼", label: "Employment History", desc: "Verified by past employers directly on-chain" },
                { icon: "📊", label: "Reputation Score", desc: "0–1000 score computed from credential portfolio" },
                { icon: "💳", label: "Credit Eligibility", desc: "Tier and credit limit based on reputation" },
              ].map(item => (
                <div key={item.label} className="card" style={{ borderRadius: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", marginTop: 32 }}>
            {/* Score card */}
            <div className="card-accent animate-fade-up" style={{ borderRadius: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <p className="number-label" style={{ color: "var(--accent)", marginBottom: 12 }}>Reputation Score</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: "clamp(52px, 9vw, 80px)", fontWeight: 800, fontFamily: "Syne, sans-serif", lineHeight: 1, color: "var(--accent)" }}>{profile.reputationScore}</span>
                    <span style={{ fontSize: 16, color: "var(--muted)" }}>/1000</span>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 8, wordBreak: "break-all" }}>{profile.address}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <span className={`tag ${profile.eligible && profile.creditLimit > 0n ? "tag-green" : "tag-dim"}`}>
                    {profile.eligible && profile.creditLimit > 0n ? `Credit Eligible · T${profile.tier}` : "Not Eligible"}
                  </span>
                  {profile.eligible && profile.creditLimit > 0n && (
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>
                      Limit: <span style={{ color: "var(--text)" }}>${USDC(profile.creditLimit)}</span>
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>
                    Since {new Date(profile.registeredAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="score-bar" style={{ marginTop: 24 }}>
                <div className="score-bar-fill" style={{ width: `${(profile.reputationScore / 1000) * 100}%` }} />
              </div>
            </div>

            {/* Score breakdown */}
            <div className="card animate-fade-up animate-fade-up-1" style={{ borderRadius: 0 }}>
              <p className="number-label" style={{ marginBottom: 20 }}>Score Breakdown</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20 }}>
                {[
                  { label: "Credentials", value: profile.credentialScore, max: 400 },
                  { label: "Longevity",    value: profile.longevityScore,  max: 200 },
                  { label: "Loan History", value: profile.loanScore,       max: 300 },
                  { label: "Identity Age", value: profile.identityScore,   max: 100 },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{item.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "Syne, sans-serif", fontWeight: 700 }}>{item.value}<span style={{ color: "var(--muted)", fontWeight: 400 }}>/{item.max}</span></span>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${(item.value / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div className="card animate-fade-up animate-fade-up-2" style={{ borderRadius: 0 }}>
              <p className="number-label" style={{ marginBottom: 20 }}>Credential Portfolio</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--border)", marginBottom: 20 }}>
                {[
                  { label: "Valid",   value: profile.validCredentials,   color: "var(--accent)" },
                  { label: "Revoked", value: profile.revokedCredentials, color: "var(--danger)" },
                ].map(s => (
                  <div key={s.label} style={{ background: "var(--surface)", padding: "20px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 800, fontFamily: "Syne, sans-serif", color: s.color }}>{s.value}</p>
                    <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { label: "Degree",     has: profile.hasDegree },
                  { label: "License",    has: profile.hasLicense },
                  { label: "Cert",       has: profile.hasCertification },
                  { label: "Employment", has: profile.hasEmployment },
                ].map(f => (
                  <span key={f.label} className={`tag ${f.has ? "tag-green" : "tag-dim"}`}>
                    {f.has ? "✓" : "✗"} {f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Credentials */}
            {profile.credentials.length > 0 && profile.credentials.map((cred, i) => (
              <div key={cred.tokenId.toString()} className="card animate-fade-up" style={{ borderRadius: 0, animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span className="number-label">#{cred.tokenId.toString().padStart(3, "0")}</span>
                      <span className={`tag ${cred.valid ? "tag-green" : cred.revoked ? "tag-red" : "tag-amber"}`}>
                        {cred.valid ? "Valid" : cred.revoked ? "Revoked" : "Expired"}
                      </span>
                      {cred.issuerTrustLevel > 0 && (
                        <span className={`tag ${cred.issuerTrustLevel === 3 ? "tag-amber" : "tag-dim"}`}>
                          {TRUST_LEVELS[cred.issuerTrustLevel]}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 700, fontFamily: "Syne, sans-serif" }}>{cred.credentialTypeLabel}</p>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{cred.issuerName}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Issued</p>
                    <p style={{ fontSize: 13 }}>{new Date(cred.issuedAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  );
}
