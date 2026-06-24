# Product

## Register

product

## Users
Developers, crypto traders, advanced Web3 builders, and fintech teams evaluating compliant settlement workflows on a testnet.

## Product Purpose
ExChange is a premium cryptocurrency wallet and Web3 labs workspace on **Sepolia testnet**. It combines a high-fidelity dashboard with **real on-chain** capabilities: ERC-20 deployment, NFT minting (IPFS + chain), contract playground deploys, ETH/EXC swaps, EXC staking, multi-sig wallets, and an institutional settlement pilot for permissioned tokenized deposits. Educational simulators (arbitrage, bridge, multi-chain staking projections) remain for learning.

## Institutional Settlement Pilot
The bank/finance next step is a sandbox compliance settlement ledger. A bank admin can issue or redeem demo BDUSD, compliance can approve/block wallets and export audit logs, and a corporate client can submit controlled transfers. Local demo data powers KYB, alerts, and approvals, while `BankPolicyRegistry` and `BankDepositToken` enforce allowlist, blocklist, limits, pause, mint, burn, and transfer checks when deployed on Sepolia.

## On-Chain Features (Sepolia)
| Feature | Status |
|---------|--------|
| Wallet connect (MetaMask via wagmi/viem) | Real |
| Token Generator (SimpleERC20 deploy) | Real |
| NFT Gallery (Pinata IPFS + SimpleNFT mint) | Real |
| Contract Playground (Hardhat artifact deploy) | Real |
| Exchange (SimpleSwap ETH ↔ EXC) | Real |
| Staking (StakingPool stake/unstake) | Real |
| Multi-Sig Safe (MultiSigWallet) | Real |
| Institutional Settlement (BankPolicyRegistry + BankDepositToken) | Real on Sepolia + local sandbox workflows |
| DeFi dashboard top stats | Real reads when connected |
| Arbitrage / Bridge labs | Educational simulator |
| Markets / Portfolio history charts | Mock + wallet-aware where noted |

## Tech Stack
- **Frontend:** React 19, Vite, wagmi v2, viem, TanStack Query
- **Contracts:** Hardhat, OpenZeppelin, Solidity 0.8.24 (Sepolia)
- **Storage:** Pinata IPFS for NFT/token metadata
- **Indexers:** Etherscan Sepolia API for tx history

## Brand Personality
Developer-centric, terminal-native, technical utility. Low noise, high density, and neon-glowing interactive micro-elements.

## Anti-references
AI slop templates (generic blue-purple gradients, generic Inter font stacks, side-stripe borders, over-decorative card containers, fake "Live" uppercase eyebrows above every text block).

## Design Principles
1. Technical Restraint: Maximize utility and data density over blank spacing and SaaS decoration.
2. High-Contrast Focus: Use clear, crisp, neon-colored indicators (green, orange, red, purple) against a dark backdrop.
3. Developer Monospace Easing: Code snippets, logs, and interactive inputs styled with monospaced monospace tags (JetBrains Mono) and smooth decelerating transitions.

## Accessibility & Inclusion
WCAG AA contrast guidelines for primary text fields and status badges. Respect reduced-motion preferences by substituting transitions with crossfades.

## Deploy & Test
See root `.env.example`. Run `npm run compile:contracts`, configure root `.env`, then `npm run deploy:sepolia`. Copy emitted `VITE_*` addresses into `.env` and run `npm run dev`.
