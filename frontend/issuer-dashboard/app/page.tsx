"use client";
import { useState, useEffect } from "react";
import { useWeb3 } from "@/hooks/useWeb3";
import { useIssuer } from "@/hooks/useIssuer";
import { FUJI_CHAIN_ID, CREDENTIAL_TYPES, BURN_AUTH_TYPES, TRUST_LEVELS } from "@/lib/contracts";

export default function Home() {
  const web3 = useWeb3();
  const { institution, loading, txPending, error, success, fetchInstitution, apply, issueCredential } = useIssuer(web3.signer, web3.address);

  useEffect(() => {
    if (web3.connected && web3.chainId === FUJI_CHAIN_ID) fetchInstitution();
  }, [web3.connected, web3.chainId, fetchInstitution]);

  if (!web3.connected) return <Landing connect={web3.connect} connecting={web3.connecting} error={web3.error} />;

  if (web3.chainId !== FUJI_CHAIN_ID) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 24, textAlign: "center", padding: "24px 20px", position: "relative", zIndex: 2 }}>
      <p style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 800 }}>Wrong Network</p>
      <p style={{ color: "var(--muted)" }}>VeraFlow runs on Avalanche Fuji Testnet.</p>
      <button className="btn-primary" onClick={web3.switchToFuji}>Switch to Fuji →</button>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
      <p style={{ color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em" }}>Loading···</p>
    </div>
  );

  if (!institution) return <ApplyForm address={web3.address!} apply={apply} txPending={txPending} error={error} success={success} disconnect={web3.disconnect} />;
  if (!institution.active) return <PendingView institution={institution} address={web3.address!} disconnect={web3.disconnect} />;

  return <IssuerDashboard address={web3.address!} institution={institution} txPending={txPending} error={error} success={success} issueCredential={issueCredential} disconnect={web3.disconnect} />;
}

function Header({ address, disconnect, badge }: { address: string; disconnect: () => void; badge?: string }) {
  return (
    <nav style={{ padding: "20px clamp(20px, 5vw, 48px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", position: "relative", zIndex: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(15px, 3vw, 18px)", letterSpacing: "-0.03em" }}>VeraFlow</span>
        <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "Syne, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 2 }}>Issuer</span>
        {badge && <span className="tag tag-green" style={{ fontSize: 9 }}>{badge}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }} className="desktop-only">{address.slice(0,6)}···{address.slice(-4)}</span>
        <button className="btn-ghost" onClick={disconnect} style={{ fontSize: 11, padding: "8px 12px" }}>Exit</button>
      </div>
    </nav>
  );
}

function Landing({ connect, connecting, error }: { connect: () => void; connecting: boolean; error: string | null }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      <nav style={{ padding: "20px clamp(20px, 5vw, 48px)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(15px, 3vw, 18px)", letterSpacing: "-0.03em" }}>VeraFlow</span>
        <button className="btn-primary" onClick={connect} disabled={connecting} style={{ padding: "12px 20px", fontSize: 12 }}>
          {connecting ? "···" : "Connect →"}
        </button>
      </nav>

      <main style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px)", maxWidth: 800, width: "100%" }}>
        <p className="number-label animate-fade-up" style={{ color: "var(--accent)", marginBottom: 20 }}>Issuer Dashboard</p>
        <h1 className="animate-fade-up animate-fade-up-1" style={{ fontSize: "clamp(44px, 9vw, 96px)", fontWeight: 800, lineHeight: 0.95, marginBottom: 32 }}>
          Issue credentials.<br />
          <span style={{ color: "var(--accent)" }}>On-chain.</span>
        </h1>
        <p className="animate-fade-up animate-fade-up-2" style={{ color: "var(--muted)", fontSize: "clamp(14px, 2vw, 16px)", maxWidth: 440, lineHeight: 1.8, marginBottom: 48 }}>
          Apply to become a verified issuer. Issue soulbound credentials directly to worker wallets. Track issuance history.
        </p>
        <div className="animate-fade-up animate-fade-up-3" style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          {[
            { n: "01", t: "Apply", d: "Submit institution" },
            { n: "02", t: "Approve", d: "Governance review" },
            { n: "03", t: "Issue", d: "Soulbound credentials" },
          ].map(s => (
            <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="number-label" style={{ color: "var(--accent)" }}>{s.n}</span>
              <span style={{ fontSize: 14, fontFamily: "Syne, sans-serif", fontWeight: 600 }}>{s.t}</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{s.d}</span>
            </div>
          ))}
        </div>
        {error && <p className="alert alert-error animate-fade-in" style={{ marginTop: 32, maxWidth: 400 }}>{error}</p>}
      </main>
    </div>
  );
}

function ApplyForm({ address, apply, txPending, error, success, disconnect }: {
  address: string; apply: (n: string, c: string) => Promise<void>;
  txPending: boolean; error: string | null; success: string | null; disconnect: () => void;
}) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      <Header address={address} disconnect={disconnect} />
      <main style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(40px, 6vw, 64px) clamp(20px, 5vw, 48px)", maxWidth: 600, width: "100%" }}>
        <p className="number-label animate-fade-up" style={{ color: "var(--accent)", marginBottom: 20 }}>Step 01</p>
        <h2 className="animate-fade-up animate-fade-up-1" style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 800, marginBottom: 16 }}>Apply as Issuer</h2>
        <p className="animate-fade-up animate-fade-up-2" style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
          Submit your institution for governance approval. Once approved you can issue credentials directly to worker wallets.
        </p>

        {error && <p className="alert alert-error animate-fade-in" style={{ marginBottom: 20 }}>{error}</p>}
        {success && <p className="alert alert-success animate-fade-in" style={{ marginBottom: 20 }}>{success}</p>}

        <div className="animate-fade-up animate-fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div>
            <label className="label">Institution Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. University of Lagos" />
          </div>
          <div>
            <label className="label">Country Code</label>
            <input className="input" value={country} onChange={e => setCountry(e.target.value.toUpperCase())} placeholder="e.g. NG" maxLength={2} style={{ textTransform: "uppercase" }} />
          </div>
        </div>

        <button className="btn-primary animate-fade-up animate-fade-up-4" onClick={() => apply(name, country)} disabled={txPending || !name || !country}>
          {txPending ? "Submitting···" : "Submit Application →"}
        </button>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 16 }}>Reviewed by the VeraFlow governance council.</p>
      </main>
    </div>
  );
}

function PendingView({ institution, address, disconnect }: {
  institution: { name: string; country: string; appliedAt: number };
  address: string; disconnect: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      <Header address={address} disconnect={disconnect} />
      <main style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "clamp(40px, 6vw, 64px) clamp(20px, 5vw, 48px)", textAlign: "center" }}>
        <div className="animate-fade-up" style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>⏳</div>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Application Pending</p>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 800, marginBottom: 12 }}>{institution.name}</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
            Your application is awaiting governance approval. No action needed — you'll be approved soon.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", borderRadius: 2, textAlign: "left" }}>
            {[
              { label: "Institution", value: institution.name },
              { label: "Country", value: institution.country },
              { label: "Applied", value: new Date(institution.appliedAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
              { label: "Status", value: "Pending Review" },
            ].map(r => (
              <div key={r.label} style={{ background: "var(--surface)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.label}</span>
                <span style={{ fontSize: 13, fontFamily: r.label === "Status" ? "Syne, sans-serif" : "inherit", color: r.label === "Status" ? "var(--warning)" : "var(--text)" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function IssuerDashboard({ address, institution, txPending, error, success, issueCredential, disconnect }: {
  address: string;
  institution: { name: string; country: string; trustLevel: number; totalIssued: number; remainingDailyLimit: number };
  txPending: boolean; error: string | null; success: string | null;
  issueCredential: (h: string, t: number, b: number, e: number, m: string) => Promise<void>;
  disconnect: () => void;
}) {
  const [holder, setHolder] = useState("");
  const [credType, setCredType] = useState(0);
  const [burnAuth, setBurnAuth] = useState(0);
  const [expiryYears, setExpiryYears] = useState("4");
  const [metaNote, setMetaNote] = useState("");

  const handleIssue = () => {
    const exp = expiryYears ? Math.floor(Date.now() / 1000) + parseInt(expiryYears) * 365 * 24 * 3600 : 0;
    issueCredential(holder, credType, burnAuth, exp, metaNote);
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto 1fr", position: "relative", zIndex: 2 }}>
      <Header address={address} disconnect={disconnect} badge={TRUST_LEVELS[institution.trustLevel]} />

      <main style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 5vw, 48px)", maxWidth: 720, width: "100%" }}>

        {/* Institution stats */}
        <div className="animate-fade-up" style={{ marginBottom: "clamp(24px, 4vw, 40px)" }}>
          <p className="number-label" style={{ color: "var(--accent)", marginBottom: 16 }}>Institution</p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, lineHeight: 1 }}>{institution.name}</h2>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{institution.country}</p>
            </div>
            <span className={`tag ${institution.trustLevel === 3 ? "tag-amber" : "tag-green"}`}>
              {TRUST_LEVELS[institution.trustLevel]}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fade-up animate-fade-up-1 stat-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: "clamp(24px, 4vw, 40px)" }}>
          <div className="stat-cell">
            <div className="stat-value">{institution.totalIssued}</div>
            <div className="stat-label">Total Issued</div>
          </div>
          <div className="stat-cell">
            <div className="stat-value" style={{ color: institution.remainingDailyLimit > 0 ? "var(--accent)" : "var(--danger)" }}>
              {institution.remainingDailyLimit}
            </div>
            <div className="stat-label">Remaining Today</div>
          </div>
        </div>

        {/* Issue form */}
        <div className="card-accent animate-fade-up animate-fade-up-2">
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(18px, 3vw, 24px)", marginBottom: 28 }}>Issue Credential</p>

          {error && <p className="alert alert-error" style={{ marginBottom: 20 }}>{error}</p>}
          {success && <p className="alert alert-success" style={{ marginBottom: 20 }}>{success}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Holder Wallet Address</label>
              <input className="input" value={holder} onChange={e => setHolder(e.target.value)} placeholder="0x..." style={{ fontFamily: "monospace", fontSize: 13 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Credential Type</label>
                <select className="select" value={credType} onChange={e => setCredType(Number(e.target.value))}>
                  {CREDENTIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Burn Authority</label>
                <select className="select" value={burnAuth} onChange={e => setBurnAuth(Number(e.target.value))}>
                  {BURN_AUTH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label">Expires In (years, 0 = never)</label>
                <input className="input" type="number" value={expiryYears} onChange={e => setExpiryYears(e.target.value)} min="0" max="100" />
              </div>
              <div>
                <label className="label">Metadata Note</label>
                <input className="input" value={metaNote} onChange={e => setMetaNote(e.target.value)} placeholder="e.g. BSc Computer Science" />
              </div>
            </div>

            <button className="btn-primary" onClick={handleIssue} disabled={txPending || !holder} style={{ marginTop: 8 }}>
              {txPending ? "Issuing···" : "Issue Credential →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
