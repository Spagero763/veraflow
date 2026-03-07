"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useLoans } from "@/hooks/useLoans";
import { Identity } from "@/hooks/useWorkerIdentity";

const USDC = (amount: bigint) => (Number(amount) / 1e6).toFixed(2);

export default function LoansPanel({ address, signer, identity }: {
  address: string;
  signer: ethers.JsonRpcSigner | null;
  identity: Identity | null;
}) {
  const { loans, assessment, loading, txPending, error, fetchLoans, borrow, repay } = useLoans(signer, address);
  const [amount, setAmount] = useState("");
  const [repayingId, setRepayingId] = useState<bigint | null>(null);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleBorrow = async () => {
    if (!amount) return;
    await borrow(ethers.parseUnits(amount, 6));
    setAmount("");
  };

  const eligible = assessment?.eligible && assessment.creditLimit > 0n;
  const hasActive = loans.some(l => l.status === 0);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[80, 120, 100].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: h, borderRadius: 3 }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* Header */}
      <div className="animate-fade-up">
        <p className="number-label" style={{ marginBottom: 20, color: "var(--accent)" }}>03 — Credit</p>
        <h2 style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
          {eligible ? "You qualify." : "Not yet eligible."}
        </h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 12, lineHeight: 1.7 }}>
          {eligible
            ? "No collateral. No bank. Your reputation is your credit score."
            : "Earn credentials from verified institutions to reach 250+ reputation and unlock credit."}
        </p>
      </div>

      {error && <p className="alert alert-error animate-fade-up">{error}</p>}

      {/* Score stats */}
      {assessment && (
        <div className="animate-fade-up animate-fade-up-1 stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { label: "Score", value: String(assessment.score) },
            { label: "Credit Limit", value: eligible ? `$${USDC(assessment.creditLimit)}` : "—" },
            { label: "Tier", value: eligible ? `Tier ${assessment.tier}` : "Locked" },
          ].map(s => (
            <div key={s.label} className="stat-cell">
              <div className="stat-value" style={{ color: s.label === "Score" && assessment.score >= 250 ? "var(--accent)" : "inherit" }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Not eligible */}
      {assessment && !eligible && (
        <div className="card animate-fade-up animate-fade-up-2">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p className="number-label" style={{ color: "var(--accent)" }}>How to qualify</p>
            {[
              { n: "01", text: "Register your identity on the Identity tab." },
              { n: "02", text: "Get credentials issued by verified institutions." },
              { n: "03", text: "Each credential adds 100 points to your score." },
              { n: "04", text: "Reach 250+ to unlock your first credit line." },
            ].map(s => (
              <div key={s.n} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 11, color: "var(--accent)", flexShrink: 0, letterSpacing: "0.1em" }}>{s.n}</span>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Borrow form */}
      {eligible && !hasActive && (
        <div className="card-accent animate-fade-up animate-fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", marginBottom: 6 }}>Borrow USDC</p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>No collateral required. Repay before the due date.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`0.00`}
                style={{ paddingRight: 80 }}
              />
              <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)", fontFamily: "Syne, sans-serif", fontWeight: 600 }}>USDC</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Max: ${USDC(assessment!.creditLimit)}</span>
              <button
                onClick={() => setAmount(USDC(assessment!.creditLimit))}
                style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "none", fontFamily: "Syne, sans-serif", fontWeight: 600, letterSpacing: "0.06em" }}
              >
                MAX
              </button>
            </div>
            <button className="btn-primary" onClick={handleBorrow} disabled={txPending || !amount} style={{ marginTop: 4 }}>
              {txPending ? <><span className="spinner" />Borrowing···</> : "Borrow →"}
            </button>
          </div>
        </div>
      )}

      {hasActive && (
        <p className="alert alert-error animate-fade-up animate-fade-up-2">
          You have an active loan. Repay it before borrowing again.
        </p>
      )}

      {/* Loan history */}
      {loans.length > 0 && (
        <div className="animate-fade-up animate-fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="number-label" style={{ color: "var(--muted)", marginBottom: 8 }}>Loan History</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
            {loans.map((loan, i) => (
              <div key={loan.loanId.toString()} className="card" style={{ borderRadius: 0, animationDelay: `${i * 0.07}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                      <span className="number-label">#{loan.loanId.toString().padStart(4, "0")}</span>
                      <span className={`tag ${loan.status === 0 ? "tag-amber" : loan.status === 1 ? "tag-green" : "tag-red"}`}>
                        {loan.statusLabel}
                      </span>
                    </div>
                    <p style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, fontFamily: "Syne, sans-serif", letterSpacing: "-0.03em" }}>
                      ${USDC(loan.principal)}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                      Repayable: ${USDC(loan.totalRepayable)} · Due {new Date(loan.dueAt * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  {loan.status === 0 && (
                    <button
                      className="btn-primary"
                      onClick={async () => { setRepayingId(loan.loanId); await repay(loan.loanId, loan.totalRepayable); setRepayingId(null); }}
                      disabled={txPending && repayingId === loan.loanId}
                      style={{ fontSize: 12, flexShrink: 0 }}
                    >
                      {txPending && repayingId === loan.loanId ? <><span className="spinner" />Repaying···</> : `Repay $${USDC(loan.totalRepayable)}`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
