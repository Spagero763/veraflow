# VeraFlow

On-chain professional identity and reputation-based credit for workers who've been locked out of the financial system.

The problem: 2 billion informal workers globally have no credit history, no way to prove their qualifications, and no access to loans without collateral. Paper certificates get faked. Banks don't care about your skills.

VeraFlow fixes this. Institutions issue tamper-proof soulbound credentials directly to worker wallets. Those credentials build an on-chain reputation score. That score unlocks credit — no bank, no collateral, no middleman.

---

## Try it

| | |
|---|---|
| 🌐 **Landing page** | https://veraflow-delta.vercel.app |
| 👷 **I'm a worker** | https://veraflow-yarq-d9vbgyla2-spageros-projects.vercel.app |
| 🏢 **I'm an employer** | https://veraflow-2uum.vercel.app |
| 🎓 **I'm an institution** | https://veraflow-wz2r-c2j1pq4yl-spageros-projects.vercel.app |

You'll need MetaMask or Core wallet with Fuji testnet AVAX to interact with the worker and issuer portals. Get test AVAX from [faucet.avax.network](https://faucet.avax.network). The employer portal requires no wallet at all.

---

## What each portal does

**Worker Portal** — Connect your wallet, register an on-chain identity, receive soulbound credentials from institutions, watch your reputation score build, and borrow USDC once you hit 250 points. Everything is on-chain. Your credentials can't be faked or transferred.

**Issuer Dashboard** — For universities, employers, and certification bodies. Apply for verified status, get approved, and issue credentials directly to worker wallet addresses. 100 credentials per day per institution. The deployer wallet is already approved as University of Lagos (NG) if you want to demo issuance immediately.

**Employer Portal** — No wallet needed. Paste any worker's wallet address and instantly see their full credential portfolio, issuer trust levels, reputation score breakdown, and credit eligibility. Workers can also share a direct link to their profile from the Credentials tab.

---

## How the score works

Workers start at 0. Every valid credential from a verified institution adds 100 points (up to 400). Account age and loan repayment history add the rest. Hit 250 to unlock credit. Hit 750 for the top tier.

| Score | Credit limit |
|---|---|
| 250–499 | $5 USDC |
| 500–749 | $5 USDC |
| 750–1000 | $5 USDC |
(the above price for now because of whats in the lending pool)
---

## Contracts (Avalanche Fuji)

All deployed and verified on [Snowtrace](https://testnet.snowtrace.io).

| Contract | Address |
|---|---|
| WorkerIdentity | [`0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766`](https://testnet.snowtrace.io/address/0x7C937A7E3C1c7C6D1776f69650Bfd1516103F766) |
| ReputationScore | [`0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a`](https://testnet.snowtrace.io/address/0x263A2433a6D7CA34222120F21c2F68d0D1D1AA7a) |
| CredentialNFT | [`0xdc7041742002F70ec635015b2e10FE52dD406A3D`](https://testnet.snowtrace.io/address/0xdc7041742002F70ec635015b2e10FE52dD406A3D) |
| CredentialRegistry | [`0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad`](https://testnet.snowtrace.io/address/0x7dC6eE61c094C794131fC4181e4B35Bcf1a63Dad) |
| LendingPool | [`0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc`](https://testnet.snowtrace.io/address/0x04DD8F6Ec0B13c689Ee479555910bc79B7496dCc) |
| CollateralOracle | [`0xD35374e2621f16580eb093B9792773E34cAbA76a`](https://testnet.snowtrace.io/address/0xD35374e2621f16580eb093B9792773E34cAbA76a) |

43 contract tests, all passing.

---

## Subgraph

Live and indexing credential issuance, identity registration, and loan events from Fuji block 38,000,000.

https://api.studio.thegraph.com/query/1743015/veraflow-protocol/v0.0.1

---

Built by Emmanuel · Build Games 2026
EOF
