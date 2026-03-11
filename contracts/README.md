# VeraFlow — Smart Contracts

On-chain professional identity and credit layer for skilled workers.

Workers get tamper-proof credentials as soulbound tokens. Those credentials feed a deterministic reputation score. That score unlocks micro-loans — no bank account, no collateral, no KYC middleman.

Built on Avalanche Fuji for Build Games 2026.

---

## The Problem

1.5 billion skilled workers globally cannot prove their qualifications to employers across borders. Paper certificates get forged. LinkedIn is unverified. Banks won't lend without a credit history that doesn't exist yet.

The result: a plumber trained in Lagos can't get a job in London because nobody trusts his certificate. A nurse in Nairobi can't get a $200 emergency loan because she has no formal credit record — despite 10 years of verified employment.

Credential fraud costs $600B/year. Financial exclusion costs workers even more.

---

## What VeraFlow Does
```
Institution                Worker                    Employer / DeFi Protocol
──────────                 ──────                    ────────────────────────
Apply to registry    →     Register DID         →    Verify credential (read)
Get approved         →     Receive credential   →    Check reputation score
Issue credentials    →     Build reputation     →    Gate services by score
                     →     Borrow against score →
                     →     Repay → score goes up →
```

Three things happen on-chain:

**1. Credential issuance** — Verified institutions (universities, hospitals, governments) mint ERC-5484 soulbound tokens to worker wallets. Non-transferable by design. Issuer stored on-chain. Revocable by issuer only.

**2. Reputation scoring** — A deterministic algorithm reads the worker's credential portfolio and loan history on-chain. No oracle. No off-chain input. Score range 0–1000. Anyone can trigger a recompute.

**3. Micro-lending** — Workers borrow stablecoins against their score. No collateral. Interest rate and loan limit determined by score tier. Default penalty hits the score. Repayment rewards it.

---

## Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        Avalanche Fuji                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GOVERNANCE LAYER                      │   │
│  │  IssuerGovernance (council multisig, proposal voting)   │   │
│  │  DisputeResolver  (stake-gated disputes, remediation)   │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │ controls                         │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │                     CORE LAYER                           │   │
│  │  CredentialRegistry  (institution whitelist + issuance) │   │
│  │  SoulboundCredential (ERC-5484 NFT, non-transferable)   │   │
│  │  CredentialVerifier  (stateless read-only verification) │   │
│  └───────────────┬───────────────────────┬─────────────────┘   │
│                  │ feeds                 │ feeds               │
│  ┌───────────────▼───────────┐  ┌────────▼────────────────┐   │
│  │      IDENTITY LAYER       │  │     LENDING LAYER        │   │
│  │  WorkerIdentity (DID reg) │  │  LendingPool (ERC-4626)  │   │
│  │  ReputationScore (0-1000) │  │  LoanManager (keeper)    │   │
│  └───────────────────────────┘  │  CollateralOracle        │   │
│                                 └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contract Addresses (Avalanche Fuji · Chain ID 43113)

All contracts deployed and verified on [Snowtrace](https://testnet.snowtrace.io). **43/43 tests passing.**

| Contract | Address |
|---|---|
| SoulboundCredential | [`0xdc7041742002F70ec635015b2e10FE52dD406A3D`](https://testnet.snowtrace.io/address/0xdc7041742002F70ec635015b2e10FE52dD406A3D) |
| CredentialRegistry | [`0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad`](https://testnet.snowtrace.io/address/0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad) |
| CredentialVerifier | [`0x9E8fd6776d72f9C71471AAbC98F6f0e2333f4928`](https://testnet.snowtrace.io/address/0x9E8fd6776d72f9C71471AAbC98F6f0e2333f4928) |
| WorkerIdentity | [`0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766`](https://testnet.snowtrace.io/address/0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766) |
| ReputationScore | [`0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a`](https://testnet.snowtrace.io/address/0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a) |
| LendingPool | [`0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc`](https://testnet.snowtrace.io/address/0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc) |
| LoanManager | [`0x4B66Edc9e30711FFa273c84e5f1df46BE9103cc1`](https://testnet.snowtrace.io/address/0x4B66Edc9e30711FFa273c84e5f1df46BE9103cc1) |
| CollateralOracle | [`0xD35374e2621f16580eb093B9792773E34cAbA76a`](https://testnet.snowtrace.io/address/0xD35374e2621f16580eb093B9792773E34cAbA76a) |
| IssuerGovernance | [`0xcBaB6c09fC25eF215a0eE00C5481E8d5195fee4a`](https://testnet.snowtrace.io/address/0xcBaB6c09fC25eF215a0eE00C5481E8d5195fee4a) |
| DisputeResolver | [`0x112BfE9b03AB35146463632b15e5fB220278418B`](https://testnet.snowtrace.io/address/0x112BfE9b03AB35146463632b15e5fB220278418B) |
| USDC (testnet) | [`0x5425890298aed601595a70AB815c96711a31Bc65`](https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65) |

---

## Scoring Model

Score range: 0–1000. Fully deterministic from on-chain state.
```
Component           Max     How it's earned
─────────────────── ─────── ──────────────────────────────────────────
Credential score    400 pts DEGREE=100-120, LICENSE=75-90,
                            CERT=50-60, EMPLOYMENT=40 (max 2),
                            SKILL/IDENTITY=15 (max 3)
                            +20% bonus for PREMIUM issuer
Longevity score     200 pts Age of oldest valid credential
                            ≥4yr=200, ≥2yr=150, ≥1yr=100, ≥6mo=50
Loan history score  300 pts Written by LoanManager after each event
                            Repaid on time=+60, Early=+70, Default=-150
Identity age score  100 pts Time since DID registration
                            ≥2yr=100, ≥1yr=75, ≥6mo=50, new=25
```

### Credit Tiers

| Tier | Min Score | Max Borrow | APR | Duration |
|---|---|---|---|---|
| 0 | 50 pts | 5 USDC | 12% | 90 days |
| 1 | 500 pts | 2,000 USDC | 9% | 180 days |
| 2 | 750 pts | 5,000 USDC | 6% | 365 days |

No collateral required at any tier.

---

## Design Decisions

**Why soulbound tokens (ERC-5484) instead of a mapping?**
Credentials need to be composable with other protocols. Any contract on Avalanche can call `CredentialVerifier.isCredentialValid(tokenId)` without understanding VeraFlow internals. A mapping in a proprietary contract is a dead end.

**Why `tx.origin` was removed from `SoulboundCredential.issue()`**
Early implementation stored `tx.origin` as the issuer so the institution address would be recorded even when the registry acted as proxy. This breaks in any account abstraction context and is a known anti-pattern. Issuer is now passed explicitly by the registry.

**Why ERC-4626 for the lending pool?**
LP tokens are composable. Liquidity providers get yield-bearing shares that can be used in other DeFi protocols on Avalanche C-Chain. Standard interface means any ERC-4626 aggregator can integrate without custom code.

**Why no oracle for the reputation score?**
Oracles introduce latency, cost, and a trust assumption. Everything VeraFlow needs to score a worker is already on-chain: credentials in `SoulboundCredential`, loan history in `LendingPool`, registration timestamp in `WorkerIdentity`. The score is recomputable by anyone at any time and produces the same result.

**Why a council multisig for governance instead of token voting?**
Token voting is plutocratic — whoever buys the most tokens controls which institutions get approved. Institution approval requires domain expertise (is this university accredited?), not capital. Council seats are held by subject matter experts.

---

## Repo Structure
```
contracts/
├── src/
│   ├── core/
│   │   ├── SoulboundCredential.sol
│   │   ├── CredentialRegistry.sol
│   │   └── CredentialVerifier.sol
│   ├── identity/
│   │   ├── WorkerIdentity.sol
│   │   └── ReputationScore.sol
│   ├── lending/
│   │   ├── LendingPool.sol
│   │   ├── LoanManager.sol
│   │   └── CollateralOracle.sol
│   ├── governance/
│   │   ├── IssuerGovernance.sol
│   │   └── DisputeResolver.sol
│   └── interfaces/
│       ├── ICredential.sol
│       ├── IWorkerIdentity.sol
│       └── ILendingPool.sol
├── test/
│   └── VeraFlow.t.sol    # 43 tests, 0 failures
└── script/
    └── Deploy.s.sol
```

---

## Running Tests
```bash
forge install
forge test
forge test -vvv    # verbose output per test
forge coverage     # coverage report
```

---

## Test Coverage
```
43 tests across the full protocol lifecycle:

Identity         WorkerCanRegister, CannotRegisterTwice, CanDeactivate,
                 DIDUnique, DIDResolvesBackToWallet, ProfileUpdate

Credentials      NonTransferable, IssuerCanRevoke, NonIssuerCannotRevoke,
                 ExpiredIsInvalid, BurnAuthEnforced, BatchVerification,
                 PortfolioSummary

Registry         InstitutionApplication, ApprovalFlow, UnapprovedCannotIssue,
                 DailyLimitTracking

Scoring          ZeroBeforeCompute, IncreasesWithCredentials,
                 NeverExceedsMax, PreviewMatchesComputed,
                 OnlyLoanManagerCanWriteLoanScore

Lending          DepositReceivesShares, BorrowWithSufficientScore,
                 CannotBorrowInsufficientScore, OneActiveLoanEnforced,
                 RepayLoan, MarkDefault, DefaultPenaltyReducesCreditLimit

Governance       ProposalCreation, QuorumPassesProposal, ExecuteProposal,
                 NonCouncilCannotVote

Disputes         RaiseDispute, MinimumStake, UpheldDispute,
                 DismissedReturnsStake

Integration      FullProtocolLifecycle
                 (register → credential → score → borrow → repay)
```

---

*Built by Emmanuel · Build Games 2026 · Avalanche Fuji*
