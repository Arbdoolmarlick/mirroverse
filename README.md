# mirro

**Permissionless copy-yield protocol on Arbitrum.** mirro indexes the top on-chain yield farmers and lets anyone mirror their strategies automatically across ETH, WBTC, USDC, USDT, USDG and more. Think copy trading, but for DeFi yield farming.

Built for the Arbitrum Open House Singapore Buildathon.

**Live app:** `<your-live-url>`
**Demo video:** `<your-video-link>`
**Network:** Arbitrum Sepolia (chain ID `421614`)

---

## What is mirro?

Yield farming rewards people who know where to look, when to move, and which pools are worth the risk. Most users don't have the time or knowledge to do that.

mirro fixes this in two parts:

1. **Index.** mirro watches on-chain yield activity on Arbitrum and ranks wallets by performance. Nobody has to register or opt in. If a wallet farms well on-chain, it appears on the leaderboard.
2. **Mirror.** Any user can deposit a supported token and copy a wallet's yield strategy. When the wallet moves capital between protocols, the smart contract mirrors that move for every copier proportionally.

No sign-up, no KYC and no permission needed. Users can stop copying and withdraw at any time.

---

## Features

- **Permissionless leaderboard** of yield farmers indexed from on-chain activity
- **Copy any wallet** with a single deposit, no registration required from the farmer
- **Multi-asset support:** ETH, WBTC, USDC, USDT, USDG, ARB and any ERC-20 the owner whitelists (no redeploy needed)
- **Farmer profiles** showing live positions, full move history, copiers and performance
- **Portfolio dashboard** showing all your active copy positions in one place
- **Non-custodial flow:** deposit, copy, stop and withdraw directly from the contract
- **Wallet connection** via Reown AppKit

---

## How it works

```
Indexer detects a wallet making a yield move on-chain
        |
        v
MirroRelayer.submitMove()
        |
        +--> MirroRegistry.recordMove()        (verifiable move history)
        |
        +--> MirroVault.executeMirrorMove()    (mirrors the move for all copiers)
```

---

## Smart contracts

| Contract | Role |
|---|---|
| `MirroVault` | Holds user funds. Handles `startCopying`, `stopCopying` and `executeMirrorMove`. Multi-token via a whitelist. |
| `MirroRegistry` | On-chain record of indexed wallets, stats, copier counts and move history. The frontend reads the leaderboard from here. |
| `MirroRelayer` | Bridge between the off-chain indexer and the contracts. Only the authorised operator can submit moves. |

### Deployed on Arbitrum Sepolia

| Contract | Address |
|---|---|
| MirroRegistry | `<address>` |
| MirroVault | `<address>` |
| MirroRelayer | `<address>` |
| USDG (test token) | `<address>` |

### Security notes

- Reentrancy guard on all state-changing functions
- Checks-effects-interactions pattern throughout
- `SafeERC20` handling for non-standard tokens such as USDT
- Token whitelist enforced on every deposit
- Bounded loop (100 copiers) in `executeMirrorMove` to stay within gas limits
- Raw ETH transfers are rejected, so funds can only enter through `startCopying`
- Contracts are **unaudited**. Do not use with real funds.

---

## Testnet notes

mirro is deployed on Arbitrum Sepolia for the buildathon. Some parts are simplified on testnet:

- **Yield is simulated** at 10% APY and paid from an owner-funded yield reserve. In production, returns come from the real value of the mirrored DeFi positions (Aave, Pendle, Curve and others).
- **Mirror moves update accounting only.** Real protocol calls (withdraw from A, deposit to B) are the next integration step, since most protocols are not fully deployed on Sepolia.
- **The relayer is trusted and centralised.** This is the honest tradeoff for an MVP. The plan is to replace it with a decentralised keeper network such as Gelato or Chainlink Automation.

---

## Tech stack

- **Contracts:** Solidity ^0.8.20, Hardhat
- **Frontend:** React, TypeScript, Nitro (Cloudflare Pages preset)
- **Wallet:** Reown AppKit
- **Runtime and package manager:** Bun
- **Design:** warm off-white editorial UI, DM Sans and DM Mono

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh)
- A wallet with Arbitrum Sepolia ETH ([faucet](https://www.alchemy.com/faucets/arbitrum-sepolia))

### Install and run

```bash
git clone <your-repo-url>
cd mirro
bun install
bun run dev
```

The app runs on `http://localhost:8080`.

### Compile contracts

```bash
bun run compile
```

### Deploy contracts

Create a `.env` file:

```
PRIVATE_KEY=your_deployer_private_key
```

Then run:

```bash
bun run scripts/deploy.ts
```

After deployment, the owner wallet must:

1. Call `registry.setVault(vault)`
2. Call `registry.setRelayer(relayer)`
3. Call `vault.setRelayer(relayer)`
4. Call `vault.addSupportedToken(token)` for each supported token
5. Call `vault.fundYieldReserve()` to fund simulated yield on testnet

### Build for production

```bash
bun run build
```

---

## Using the app

1. Open the app and click **Continue to app**
2. Browse the **Leaderboard** of indexed wallets
3. Open a farmer profile to see positions, move history and copiers
4. Connect your wallet and switch to **Arbitrum Sepolia**
5. Click **Mirror**, approve the token and confirm `startCopying`
6. Track your position in **Dashboard** and **Portfolio**
7. Click **Stop Mirroring** to withdraw your deposit plus yield

---

## Roadmap

- Real protocol execution for mirror moves (Aave, Pendle, Curve, Morpho)
- Live indexer service with APY scoring and alpha-vs-baseline ranking
- AI pool vetting (approve, caution or reject) before pools appear in the app
- Tokenized stock support on Robinhood Chain
- Decentralised relayer via a keeper network
- Withdrawal queue, vault capacity limits and risk-adjusted leaderboard metrics
- Security audit before any mainnet deployment

---

## License

MIT
