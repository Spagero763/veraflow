# VeraFlow

> On-chain professional identity and reputation-based credit for the 2 billion workers locked out of the financial system.

**The problem:** Informal workers have no credit history, no way to prove their qualifications, and no access to loans without collateral. Paper certificates get faked. Banks don't care about your skills.

**VeraFlow fixes this.** Institutions issue tamper-proof soulbound credentials directly to worker wallets. Those credentials build an on-chain reputation score. That score unlocks USDC credit — no bank, no collateral, no middleman.

---

## Live Demos

| Portal | URL | Wallet required? |
|---|---|---|
| 🌐 Landing page | https://veraflow-delta.vercel.app | No |
| 👷 Worker Portal | https://veraflow-yarq.vercel.app | Yes (Fuji AVAX) |
| 🏢 Employer Portal | https://veraflow-2uum.vercel.app | No |
| 🎓 Issuer Dashboard | https://veraflow-wz2r.vercel.app | Yes (Fuji AVAX) |

**Quick start for judges:**
1. Get test AVAX from [faucet.avax.network](https://faucet.avax.network) (select Fuji C-Chain)
2. Open the Worker Portal → connect MetaMask → Register Identity
3. Open the Issuer Dashboard → connect the deployer wallet → Issue a credential to your worker wallet
   - Deployer wallet is pre-approved as **University of Lagos (NG)** — ready to issue immediately
4. Back in Worker Portal → Refresh Score → go to Loans → borrow USDC
5. Open Employer Portal → paste your worker address → see full credential portfolio (no wallet needed)

---

## How It Works

```
Institution applies            Worker registers
on Issuer Dashboard     →      on Worker Portal
        ↓                             ↓
Admin approves             Receives soulbound
institution                credential NFT
        ↓                             ↓
Institution issues    →    Reputation score
credentials                builds on-chain
                                  ↓
                          Borrows USDC from
                          LendingPool (no collateral)
                                  ↓
                          Repays → score improves
                          → borrows again
```

---

## Portals

### Worker Portal
Connect wallet → register on-chain identity → receive soulbound credentials from verified institutions → reputation score builds automatically → borrow USDC when score ≥ 50 points → repay to improve score and re-borrow. Copy a shareable link to your credential profile from the Credentials tab.

### Issuer Dashboard
For universities, employers, and certification bodies. Apply for verified issuer status, get approved by the protocol admin, then issue tamper-proof soulbound credential NFTs directly to worker wallet addresses. Up to 100 credentials per day per institution.

### Employer Portal
No wallet needed. Paste any worker wallet address to instantly see their full credential portfolio, issuer trust levels, reputation score breakdown, and credit eligibility — all verified on-chain, impossible to fake.

### Admin Panel
At `/admin` on the Issuer Dashboard. Deployer wallet only. Approve/reject institution applications and manage protocol parameters.

---

## Reputation Score

Scores are computed fully on-chain by `ReputationScore.sol`. Max 1000 points.

| Component | Max Points | How |
|---|---|---|
| Credential score | 400 | Based on credential type and issuer trust level |
| Longevity score | 200 | Identity age — longer history = higher score |
| Loan score | 300 | Repayment history — on-time repayments boost score |
| Identity score | 100 | Base score on registration (25 pts minimum) |

---

## Credit Tiers

| Tier | Min Score | Max Borrow | APR | Duration |
|---|---|---|---|---|
| Tier 0 | 50 pts | 5 USDC | 12% | 90 days |
| Tier 1 | 500 pts | 2,000 USDC | 9% | 180 days |
| Tier 2 | 750 pts | 5,000 USDC | 6% | 365 days |

No collateral required at any tier. Credit eligibility is determined entirely by on-chain reputation.

---

## Smart Contracts (Avalanche Fuji · Chain ID 43113)

All 14 contracts deployed and verified on [Snowtrace](https://testnet.snowtrace.io). **43/43 tests passing.**

| Contract | Address |
|---|---|
| WorkerIdentity | [`0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766`](https://testnet.snowtrace.io/address/0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766) |
| ReputationScore | [`0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a`](https://testnet.snowtrace.io/address/0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a) |
| CredentialNFT | [`0xdc7041742002F70ec635015b2e10FE52dD406A3D`](https://testnet.snowtrace.io/address/0xdc7041742002F70ec635015b2e10FE52dD406A3D) |
| CredentialRegistry | [`0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad`](https://testnet.snowtrace.io/address/0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad) |
| LendingPool | [`0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc`](https://testnet.snowtrace.io/address/0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc) |
| CollateralOracle | [`0xD35374e2621f16580eb093B9792773E34cAbA76a`](https://testnet.snowtrace.io/address/0xD35374e2621f16580eb093B9792773E34cAbA76a) |
| USDC (testnet) | [`0x5425890298aed601595a70AB815c96711a31Bc65`](https://testnet.snowtrace.io/address/0x5425890298aed601595a70AB815c96711a31Bc65) |

---

## Tech Stack

**Smart Contracts**
- Solidity 0.8.x · Foundry (forge, cast, anvil)
- ERC-5484 soulbound NFT standard
- Custom reputation engine with on-chain computation
- 14 contracts · 43/43 tests passing

**Indexing**
- The Graph (subgraph live on Studio)
- Indexes: identity registrations, credential issuance, loan events, repayments
- Endpoint: `https://api.studio.thegraph.com/query/1743015/veraflow-protocol/v0.0.1`

**Frontend**
- Next.js 14 · TypeScript · ethers.js v6
- Syne + DM Sans fonts
- Animated particle canvas · dark design system
- PWA-ready · fully responsive (mobile + desktop)
- Auto-deployed to Vercel from GitHub main branch

---

## Repository Structure

```
veraflow/
├── contracts/            # Foundry project
│   ├── src/
│   │   ├── identity/     # WorkerIdentity.sol
│   │   ├── credentials/  # CredentialNFT.sol, CredentialRegistry.sol
│   │   ├── reputation/   # ReputationScore.sol
│   │   ├── lending/      # LendingPool.sol, CollateralOracle.sol
│   │   └── interfaces/   # All contract interfaces
│   └── test/             # 43 Foundry tests
├── subgraph/             # The Graph subgraph
│   ├── schema.graphql
│   └── src/              # Event handlers
└── frontend/
    ├── worker-app/       # Worker PWA (Next.js)
    ├── employer-portal/  # Employer Portal (Next.js)
    ├── issuer-dashboard/ # Issuer + Admin (Next.js)
    └── landing/          # Landing page (Next.js)
```

---


## Demo Credentials

The deployer wallet (`0x6DD6F038583a70eFEF80f5B0A34B9a60AC36Be39`) is pre-approved as **University of Lagos, Nigeria (Trust Level 2)** and can issue credentials immediately for judging purposes.

Connect the deployer wallet on the Issuer Dashboard and use the Issue Credential form to issue to any worker wallet address.

---

*Built by Emmanuel · Build Games 2026 · Avalanche Fuji*
