# FlowState

**Realtime Dynamic NFT Social Protocol on Monad**

FlowState creates evolving NFT identities that update in real-time based on on-chain social interactions. Built for the Monad ecosystem to leverage its high throughput and low latency.

## Features

- **Dynamic NFTs**: Your NFT evolves based on your on-chain social activity
- **Real-time Updates**: State changes every minute based on interactions
- **Social Interactions**: Like and tip other users
- **Three State Levels**: Idle → Active → Burning

## State Levels

| Level | Name | Interactions (2 epochs) | Visual |
|-------|------|------------------------|--------|
| 0 | Idle | 0-4 | Gray |
| 1 | Active | 5-19 | Cyan |
| 2 | Burning | 20+ | Orange (animated) |

## Quick Start

### Prerequisites

- Node.js 18+
- Yarn

### Installation

```bash
# Install dependencies
yarn install

# Start local Hardhat node
yarn chain

# In another terminal, deploy contracts
yarn deploy

# Start the frontend
yarn start
```

### Available Scripts

- `yarn chain` - Start local Hardhat node
- `yarn compile` - Compile smart contracts
- `yarn deploy` - Deploy contracts to local network
- `yarn test` - Run contract tests
- `yarn start` - Start Next.js development server
- `yarn build` - Build for production

## Smart Contracts

### FlowNFT.sol
Main NFT contract with dynamic metadata. One NFT per address.

### ActivityTracker.sol
Tracks likes between users. Updates FlowNFT state on each action.

### TipModule.sol
Handles micro-tipping with minimum 0.0001 ETH. Uses pull pattern for security.

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.20, Hardhat
- **Frontend**: Next.js 14, React, Tailwind CSS, DaisyUI
- **Web3**: wagmi v2, viem
- **Network**: Monad Testnet / Hardhat local

## Deployment

### Monad Testnet

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your DEPLOYER_PRIVATE_KEY

# Deploy to Monad testnet
yarn deploy --network monadTestnet
```

## License

MIT
