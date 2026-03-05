"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, CREDENTIAL_NFT_ABI, CREDENTIAL_TYPES } from "@/lib/contracts";

type Credential = { tokenId: bigint; issuer: string; credentialType: number; issuedAt: number; expiresAt: number; revoked: boolean; valid: boolean; };

export default function CredentialsPanel({ address, signer }: { address: string; signer: ethers.JsonRpcSigner | null }) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetch = useCallback(async () => {
    if (!signer || !address) return;
    setLoading(true);
    try {
      const nft = new ethers.Contract(CONTRACTS.CREDENTIAL_NFT, CREDENTIAL_NFT_ABI, signer);
      const ids: bigint[] = await nft.getCredentialsByHolder(address);
      const creds = await Promise.all(ids.map(async id => {
        const [c, valid] = await Promise.all([nft.getCredential(id), nft.isValid(id)]);
        return { tokenId: id, issuer: c.issuer, credentialType: Number(c.credentialType), issuedAt: Number(c.issuedAt), expiresAt: Number(c.expiresAt), revoked: c.revoked, valid };
      }));
      setCredentials(creds);
    } catch { setCredentials([]); }
    finally { setLoading(false); }
  }, [signer, address]);

  useEffect(() => { fetch(); }, [fetch]);

  const copyShareLink = () => {
    const url = `${window.location.origin.replace("3000", "3001")}?address=${address}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1,2].map(i => <div key={i} style={{ height: 100, background: "var(--surface)", borderRadius: 2 }} />)}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 4vw, 36px)" }}>
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 16, color: "var(--accent)" }}>02 — Credentials</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800 }}>{credentials.length} total</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{credentials.filter(c => c.valid).length} valid</span>
            <button className="btn-ghost" onClick={copyShareLink} style={{ fontSize: 11, padding: "6px 12px" }}>
              {copied ? "✓ Copied" : "Share Profile →"}
            </button>
          </div>
        </div>
      </div>

      {credentials.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
          {/* Empty state with next steps */}
          <div className="card animate-fade-up animate-fade-up-1" style={{ borderRadius: 0, textAlign: "center", padding: "clamp(40px, 6vw, 60px) 24px" }}>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(18px, 3vw, 24px)", marginBottom: 12 }}>No credentials yet.</p>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Credentials are issued by verified institutions — universities, certification bodies, and employers — directly to your wallet.
            </p>
          </div>

          {/* Next steps */}
          <div className="card animate-fade-up animate-fade-up-2" style={{ borderRadius: 0 }}>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 20 }}>How to get credentials</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { n: "01", text: "Share your wallet address with a verified institution — your university, employer, or certification body." },
                { n: "02", text: "Ask them to visit the Issuer Dashboard and issue a credential directly to your wallet address." },
                { n: "03", text: "The credential appears here as a soulbound NFT. It can't be transferred or faked." },
                { n: "04", text: "Your reputation score updates automatically. Once you reach 250+, you unlock credit access." },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <span className="number-label" style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>{s.n}</span>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Share wallet */}
          <div className="card-accent animate-fade-up animate-fade-up-3" style={{ borderRadius: 0 }}>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 12 }}>Your Wallet Address</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <code style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", flex: 1, wordBreak: "break-all", lineHeight: 1.6 }}>{address}</code>
              <button
                className="btn-ghost"
                onClick={() => { navigator.clipboard.writeText(address); }}
                style={{ fontSize: 11, padding: "8px 14px", flexShrink: 0 }}
              >
                Copy →
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
              Share this with institutions so they can issue credentials to you.
            </p>
          </div>

          {/* Link to issuer dashboard */}
          <div className="card animate-fade-up animate-fade-up-4" style={{ borderRadius: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15 }}>Are you an institution?</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Apply to issue credentials on the Issuer Dashboard.</p>
            </div>
            <a href="http://localhost:3002" className="btn-ghost" style={{ textDecoration: "none", fontSize: 12 }}>
              Issuer Dashboard →
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Share button when has credentials */}
          <div className="card-accent animate-fade-up animate-fade-up-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14 }}>Share your credential profile</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Send employers a link to verify your credentials instantly.</p>
            </div>
            <button className="btn-primary" onClick={copyShareLink} style={{ fontSize: 12 }}>
              {copied ? "✓ Link Copied" : "Copy Share Link →"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
            {credentials.map((cred, i) => (
              <div key={cred.tokenId.toString()} className="card animate-fade-up" style={{ borderRadius: 0, animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span className="number-label">#{cred.tokenId.toString().padStart(3, "0")}</span>
                      <span className={`tag ${cred.valid ? "tag-green" : cred.revoked ? "tag-red" : "tag-amber"}`}>
                        {cred.valid ? "Valid" : cred.revoked ? "Revoked" : "Expired"}
                      </span>
                    </div>
                    <p style={{ fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 700, fontFamily: "Syne, sans-serif" }}>
                      {CREDENTIAL_TYPES[cred.credentialType] ?? "Unknown"}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 6 }}>
                      {cred.issuer.slice(0, 10)}···{cred.issuer.slice(-6)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>Issued</p>
                    <p style={{ fontSize: 13 }}>{new Date(cred.issuedAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    {cred.expiresAt > 0 && (
                      <>
                        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Expires</p>
                        <p style={{ fontSize: 13 }}>{new Date(cred.expiresAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
