"use client";
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  CONTRACTS,
  LENDING_POOL_ABI,
  COLLATERAL_ORACLE_ABI,
  USDC_ABI,
  USDC_ADDRESS,
  LOAN_STATUS,
} from "@/lib/contracts";

export type Loan = {
  loanId: bigint;
  borrower: string;
  principal: bigint;
  totalRepayable: bigint;
  amountRepaid: bigint;
  interestRate: bigint;
  status: number;
  statusLabel: string;
  originatedAt: number;
  dueAt: number;
  lastRepaidAt: number;
};

export type CreditAssessment = {
  eligible: boolean;
  score: number;
  tier: number;
  creditLimit: bigint;
  utilizationMultiplier: bigint;
};

export function useLoans(signer: ethers.JsonRpcSigner | null, address: string | null) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    if (!signer || !address) return;
    setLoading(true);
    try {
      const pool = new ethers.Contract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const oracle = new ethers.Contract(CONTRACTS.COLLATERAL_ORACLE, COLLATERAL_ORACLE_ABI, signer);

      const assess = await oracle.assess(address);
      setAssessment({
        eligible: assess.eligible,
        score: Number(assess.score),
        tier: Number(assess.tier),
        creditLimit: assess.creditLimit,
        utilizationMultiplier: assess.utilizationMultiplier,
      });

      // Fetch loans via subgraph — for now scan last 20 loan IDs
      // In production this comes from The Graph
      const loanList: Loan[] = [];
      for (let i = 1; i <= 20; i++) {
        try {
          const loan = await pool.getLoan(i);
          if (loan.borrower.toLowerCase() === address.toLowerCase()) {
            loanList.push({
              loanId: loan.loanId,
              borrower: loan.borrower,
              principal: loan.principal,
              totalRepayable: loan.totalRepayable,
              amountRepaid: loan.amountRepaid,
              interestRate: loan.interestRate,
              status: Number(loan.status),
              statusLabel: LOAN_STATUS[Number(loan.status)] ?? "Unknown",
              originatedAt: Number(loan.originatedAt),
              dueAt: Number(loan.dueAt),
              lastRepaidAt: Number(loan.lastRepaidAt),
            });
          }
        } catch {
          break;
        }
      }
      setLoans(loanList);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  }, [signer, address]);

  const borrow = useCallback(async (amount: bigint) => {
    if (!signer) return;
    setTxPending(true);
    setError(null);
    try {
      const pool = new ethers.Contract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const tx = await pool.borrow(amount);
      await tx.wait();
      await fetchLoans();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Borrow failed");
    } finally {
      setTxPending(false);
    }
  }, [signer, fetchLoans]);

  const repay = useCallback(async (loanId: bigint, amount: bigint) => {
    if (!signer) return;
    setTxPending(true);
    setError(null);
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const allowance = await usdc.allowance(address, CONTRACTS.LENDING_POOL);
      if (allowance < amount) {
        const approveTx = await usdc.approve(CONTRACTS.LENDING_POOL, amount);
        await approveTx.wait();
      }
      const pool = new ethers.Contract(CONTRACTS.LENDING_POOL, LENDING_POOL_ABI, signer);
      const tx = await pool.repay(loanId, amount);
      await tx.wait();
      await fetchLoans();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Repayment failed");
    } finally {
      setTxPending(false);
    }
  }, [signer, address, fetchLoans]);

  return { loans, assessment, loading, txPending, error, fetchLoans, borrow, repay };
}
