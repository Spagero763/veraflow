"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useLoans } from "@/hooks/useLoans";
import { Identity } from "@/hooks/useWorkerIdentity";

const USDC = (amount: bigint) => (Number(amount) / 1e6).toFixed(2);

export default function LoansPanel({ address, signer, identity }: { address: string; signer: ethers.JsonRpcSigner | null; identity: Identity | null }) {
  const { loans, assessment, loading, txPending, error, fetchLoans, borrow, repay } = useLoans(signer, address);
  const [amount, setAmount] = useState("");
  const [repayingId, setRepayingId] = useState<bigint | null>(null);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleBorrow = async () => { if (!amount) return; await borrow(ethers.parseUnits(amount, 6)); setAmount(""); };
  const eligible = assessment?.eligible && assessment.creditLimit > 0n;
  const hasActive = loans.some(l => l.status === 0);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1,2].map(i => <div key={i} style={{ height: 100, background: "var(--surface)", borderRadius: 2 }} />)}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "clamp(24px, 4vw, 36px)" }}>
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 16, color: "var(--accent)" }}>03 — Loans</p>
        <h2 style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800 }}>Credit</h2>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {assessment && (
        <div className="animate-fade-up animate-fade-up-1 stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { label: "Score", value: String(assessment.score) },
            { label: "Credit Limit", value: eligible ? `$${USDC(assessment.creditLimit)}` : "—" },
            { label: "Tier", value: eligible ? `Tier ${assessment.tier}` : "—" },
          ].map(s => (
            <div key={s.label} className="stat-cell">
              <div className="stat-value" style={{ fontSize: "clamp(20px, 4vw, 28px)" }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {assessment && !eligible && (
        <div className="card animate-fade-up animate-fade-up-2" style={{ borderLeft: "2px solid var(--border)" }}>
          <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
            Score of 50+ required to borrow. Register your identity and earn credentials from verified institutions to qualify.
          </p>
        </div>
      )}

      {eligible && !hasActive && (
        <div className="card-accent animate-fade-up animate-fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15 }}>Borrow USDC</p>
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max $${USDC(assessment!.creditLimit)}`} />
            <button className="btn-primary" onClick={handleBorrow} disabled={txPending || !amount}>
              {txPending ? "Borrowing..." : "Borrow →"}
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>No collateral. No bank. Repay before due date.</p>
        </div>
      )}

      {hasActive && <p className="alert alert-error">Active loan exists. Repay before borrowing again.</p>}

      {loans.length > 0 && (
        <div className="animate-fade-up animate-fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
          {loans.map((loan, i) => (
            <div key={loan.loanId.toString()} className="card" style={{ borderRadius: 0, animationDelay: `${i * 0.08}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <span className="number-label">#{loan.loanId.toString().padStart(3, "0")}</span>
                    <span className={`tag ${loan.status === 0 ? "tag-amber" : loan.status === 1 ? "tag-green" : "tag-red"}`}>{loan.statusLabel}</span>
                  </div>
                  <p style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 700, fontFamily: "Syne, sans-serif" }}>${USDC(loan.principal)}</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    Repayable: ${USDC(loan.totalRepayable)} · Due {new Date(loan.dueAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                {loan.status === 0 && (
                  <button className="btn-primary" onClick={async () => { setRepayingId(loan.loanId); await repay(loan.loanId, loan.totalRepayable); setRepayingId(null); }} disabled={txPending && repayingId === loan.loanId} style={{ fontSize: 12 }}>
                    {txPending && repayingId === loan.loanId ? "Repaying..." : `Repay $${USDC(loan.totalRepayable)}`}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
