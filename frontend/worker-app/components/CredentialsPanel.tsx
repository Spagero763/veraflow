"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, CREDENTIAL_NFT_ABI, CREDENTIAL_TYPES } from "@/lib/contracts";

type Credential = {
  tokenId: bigint;
  issuer: string;
  credentialType: number;
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
  valid: boolean;
};

const EMPLOYER_URL = "https://veraflow-2uum.vercel.app";
const ISSUER_URL = "https://veraflow-wz2r-c2j1pq4yl-spageros-projects.vercel.app";

export default function CredentialsPanel({ address, signer }: { address: string; signer: ethers.JsonRpcSigner | null }) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${EMPLOYER_URL}?address=${address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[140, 100, 100].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 3 }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* Header */}
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 20, color: "var(--accent)" }}>02 — Credentials</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <h2 style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {credentials.length === 0 ? "No credentials" : `${credentials.length} credential${credentials.length > 1 ? "s" : ""}`}
          </h2>
          {credentials.length > 0 && (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {credentials.filter(c => c.valid).length} valid · {credentials.filter(c => c.revoked).length} revoked
            </span>
          )}
        </div>
      </div>

      {credentials.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>

          {/* Empty hero */}
          <div className="card animate-fade-up animate-fade-up-1" style={{ borderRadius: 0, padding: "48px 28px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid var(--border-2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>🎓</div>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 12, letterSpacing: "-0.03em" }}>No credentials yet</p>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8, maxWidth: 380, margin: "0 auto" }}>
              Credentials are soulbound NFTs issued by verified institutions — universities, certification bodies, and employers.
            </p>
          </div>

          {/* Steps */}
          <div className="card animate-fade-up animate-fade-up-2" style={{ borderRadius: 0 }}>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 24 }}>How to get credentials</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { n: "01", text: "Share your wallet address with a verified institution — your university, employer, or certification body." },
                { n: "02", text: "Ask them to visit the Issuer Dashboard and issue a credential directly to your wallet address." },
                { n: "03", text: "The credential appears here as a soulbound NFT. It can't be transferred or faked." },
                { n: "04", text: "Your reputation score updates automatically. Reach 250+ to unlock credit access." },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 11, color: "var(--accent)", flexShrink: 0, marginTop: 2, letterSpacing: "0.1em" }}>{s.n}</span>
                  <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.75 }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Wallet address */}
          <div className="card-accent animate-fade-up animate-fade-up-3" style={{ borderRadius: 0 }}>
            <p className="number-label" style={{ color: "var(--accent)", marginBottom: 14 }}>Your Wallet Address</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <code style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "monospace", flex: 1, wordBreak: "break-all", lineHeight: 1.7 }}>{address}</code>
              <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(address)} style={{ fontSize: 11, padding: "8px 14px", flexShrink: 0 }}>
                Copy →
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, lineHeight: 1.6 }}>
              Share this with institutions so they can issue credentials directly to your wallet.
            </p>
          </div>

          {/* Issuer CTA */}
          <div className="card animate-fade-up animate-fade-up-4" style={{ borderRadius: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>Are you an institution?</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Apply to issue on-chain credentials to workers.</p>
            </div>
            <a href={ISSUER_URL} className="btn-ghost" style={{ textDecoration: "none", fontSize: 11 }}>
              Issuer Dashboard →
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Share banner */}
          <div className="card-accent animate-fade-up animate-fade-up-1" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>Share your credential profile</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Send employers a link to instantly verify your credentials.</p>
            </div>
            <button className="btn-primary" onClick={copyShareLink} style={{ fontSize: 12, flexShrink: 0 }}>
              {copied ? "✓ Copied!" : "Copy Share Link →"}
            </button>
          </div>

          {/* Credential list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
            {credentials.map((cred, i) => (
              <div
                key={cred.tokenId.toString()}
                className="card animate-fade-up"
                style={{ borderRadius: 0, animationDelay: `${i * 0.07}s` }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span className="number-label">#{cred.tokenId.toString().padStart(4, "0")}</span>
                      <span className={`tag ${cred.valid ? "tag-green" : cred.revoked ? "tag-red" : "tag-amber"}`}>
                        {cred.valid ? "Valid" : cred.revoked ? "Revoked" : "Expired"}
                      </span>
                      <span className="tag tag-dim">Soulbound</span>
                    </div>
                    <p style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 700, fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
                      {CREDENTIAL_TYPES[cred.credentialType] ?? "Unknown Credential"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", marginTop: 8 }}>
                      Issuer: {cred.issuer.slice(0, 10)}···{cred.issuer.slice(-6)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Syne, sans-serif", marginBottom: 4 }}>Issued</p>
                    <p style={{ fontSize: 13, fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
                      {new Date(cred.issuedAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {cred.expiresAt > 0 && (
                      <>
                        <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Syne, sans-serif", marginTop: 12, marginBottom: 4 }}>Expires</p>
                        <p style={{ fontSize: 13, fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
                          {new Date(cred.expiresAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
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
