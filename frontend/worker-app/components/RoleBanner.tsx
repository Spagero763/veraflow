"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

const WORKER_IDENTITY = "0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766";
const CREDENTIAL_REGISTRY = "0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad";

const IDENTITY_ABI = ["function isActive(address wallet) external view returns (bool)"];
const REGISTRY_ABI = ["function isApproved(address wallet) external view returns (bool)"];

const URLS = {
  worker: "https://veraflow-yarq.vercel.app",
  issuer: "https://veraflow-wz2r.vercel.app",
  employer: "https://veraflow-2uum.vercel.app",
};

export default function RoleBanner({ address, provider }: {
  address: string;
  provider: ethers.BrowserProvider;
}) {
  const [suggestion, setSuggestion] = useState<{ label: string; url: string; reason: string } | null>(null);

  useEffect(() => {
    if (!address || !provider) return;
    setSuggestion(null);
    const detect = async () => {
      try {
        const signer = await provider.getSigner();
        const registry = new ethers.Contract(CREDENTIAL_REGISTRY, REGISTRY_ABI, signer);
        const isInstitution = await registry.isApproved(address).catch(() => false);
        if (isInstitution) {
          setSuggestion({
            label: "Issuer Dashboard",
            url: URLS.issuer,
            reason: "Your wallet is a verified institution.",
          });
        }
      } catch { /* silent */ }
    };
    detect();
  }, [address, provider]);

  if (!suggestion) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, background: "var(--surface)", border: "1px solid var(--accent)",
      borderRadius: 4, padding: "14px 20px", display: "flex", alignItems: "center",
      gap: 16, maxWidth: "calc(100vw - 48px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    }}>
      <div>
        <p style={{ fontSize: 13, fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: 2 }}>
          {suggestion.reason}
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          You might be looking for the {suggestion.label}.
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <a href={suggestion.url} className="btn-primary" style={{ fontSize: 11, padding: "8px 14px", textDecoration: "none", whiteSpace: "nowrap" }}>
          Go there →
        </a>
        <button onClick={() => setSuggestion(null)} className="btn-ghost" style={{ fontSize: 11, padding: "8px 12px" }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
