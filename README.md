# ChainMate - AI-Powered Crypto Companion for BSC

**Simplify blockchain transactions with AI. Send tokens, schedule payments, and manage crypto through natural language on BNB Smart Chain.**

[![BSC](https://img.shields.io/badge/BSC-Testnet-yellow)](https://testnet.bscscan.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)

Built for **Good Vibes Only: OpenClaw Edition** Hackathon 🚀

---

## 🌟 Overview

**ChainMate** is an AI-powered dApp that transforms how users interact with blockchain technology. Instead of navigating complex interfaces, users can simply chat with ChainMate:
- *"Send 10 BNB to Alice tomorrow"*
- *"Show my transaction analytics"*
- *"Schedule a payment for next Friday"*
- *"Warn me if this address looks suspicious"*

---

## 🚀 Features

### 🤖 AI-Powered Chat Interface
- **Natural Language Processing** via Google Gemini AI
- Conversational transaction initiation
- Smart intent detection
- Context-aware responses

### 💸 Smart Transactions
- **Instant Transfers**: Send BNB and ERC20 tokens
- **Scheduled Payments**: Time-locked transactions
- **Conditional Payments**: Execute based on price thresholds
- **Team Transactions**: Multi-signature approval workflows
- **Contact Management**: Save and verify frequent recipients

### 📊 Analytics Dashboard
- Real-time transaction tracking
- Spending patterns and insights
- Portfolio performance monitoring
- 7-day spending trends visualization
- Top recipients analysis

### 🛡️ Security Features
- **Address Verification**: Reputation scoring
- **Risk Assessment**: AI-powered scam detection
- **Transaction Validation**: Double-check before sending
- **Smart Contract Auditing**: OpenZeppelin secure contracts

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **Privy** - Wallet authentication
- **Wagmi** - React hooks for Ethereum
- **Google Gemini AI** - Natural language processing
- **Ethers.js** - Blockchain interactions

### Smart Contracts
- **Solidity 0.8.20** - Contract development
- **OpenZeppelin** - Secure contract libraries
- **Hardhat** - Development environment
- **BSC Testnet** - Deployment network

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- BSC Testnet BNB ([Get from faucet](https://testnet.binance.org/faucet-smart))

### Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/chainmate.git
cd chainmate
npm install
```

2. **Environment Setup**
Copy `.env.example` to `.env.local` and fill in:
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_CHAIN_ID=97
```

3. **Deploy Smart Contracts**
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network bscTestnet
```
Copy the deployed contract addresses to your `.env.local`!

4. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 Usage

### 1. Connect Wallet
Click "Connect Wallet" and choose your login method (MetaMask, Email, or Google)

### 2. Get Test Tokens
Get BSC Testnet BNB from [official faucet](https://testnet.binance.org/faucet-smart)
Claim CMT tokens using the in-app faucet

### 3. Start Chatting
Try these commands:
```
"Send 5 CMT to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
"Schedule 10 BNB to Alice in 24 hours"
"Show my transaction history"
"Add contact named Bob"
"Check balance"
```

---

## 📋 Smart Contracts

### ChainMateCore
Main contract handling:
- Scheduled payments with time-locks
- Conditional payments
- Contact management
- Team multi-sig transactions
- Transaction tracking

**Deployed on BSC Testnet**: `[Will be updated after deployment]`

### ChainMateToken (CMT)
ERC20 test token with faucet functionality

**Deployed on BSC Testnet**: `[Will be updated after deployment]`

---

## 🧪 Testing

```bash
# Run tests
npx hardhat test

# Test coverage
npx hardhat coverage

# Local network
npx hardhat node
```

---

## 🚢 Deployment

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel --prod
```

---

## 🗺️ Roadmap

### Phase 1 (Hackathon)
- ✅ Core AI chat interface
- ✅ Basic transaction features
- ✅ Scheduled payments
- ✅ Analytics dashboard
- ✅ Contact management
- ✅ BSC Testnet deployment

### Phase 2 (Post-Hackathon)
- Voice command integration
- Mobile app
- Cross-chain support
- DeFi integration
- Advanced AI features

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **BNB Chain** for hosting the hackathon
- **OpenClaw** framework inspiration
- **Privy** for wallet authentication
- **Google Gemini** for AI capabilities
- **OpenZeppelin** for secure contracts

---

**Built for Good Vibes Only: OpenClaw Edition** 🚀

*Making blockchain accessible through AI*
