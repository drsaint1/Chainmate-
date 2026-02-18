# ChainMate - AI-Powered Crypto Companion for BNB Chain

ChainMate is an AI-powered dApp that makes blockchain interaction simple, conversational, and intelligent. Users interact with BSC through natural language or voice commands — sending tokens, swapping via PancakeSwap, scheduling payments, creating multi-sig teams, and more.

Built for the **Good Vibes Only: OpenClaw Edition** hackathon on BNB Chain.

**Track:** Agent (AI Agent x Onchain Actions)

---

## Onchain Proof

| Contract | Address | Network |
|----------|---------|---------|
| ChainMateCore | `0x962A00d762692F8692B90914577d5191e79a514b` | BSC Testnet (97) |
| ChainMateToken (CMT) | `0xFc4EDCF2CA8068b2A750Ad4507297aba0807CdC5` | BSC Testnet (97) |
| PancakeSwap V2 Router | `0xD99D1c33F9fC3444f8101754aBC46c52416550D1` | BSC Testnet (97) |

All transactions produce verifiable tx hashes linked to [BscScan Testnet](https://testnet.bscscan.com).

---

## Tech Stack

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Privy** - Wallet authentication (email, Google, wallet)
- **Wagmi + Viem** - Ethereum/BSC React hooks
- **Ethers.js v6** - Blockchain interactions
- **Google Gemini 2.5 Flash** - AI natural language processing
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Smart Contracts
- **Solidity 0.8.20** - Contract language
- **Hardhat** - Development & deployment
- **OpenZeppelin** - Secure contract libraries
- **PancakeSwap V2** - DEX integration for token swaps

### Blockchain
- **BSC Testnet** (Chain ID: 97) - Primary network
- **BSC Mainnet** (Chain ID: 56) - Supported

---

## Features

### 1. AI Chat Interface
Users interact with blockchain through natural language. The AI (Google Gemini) understands intent and executes the appropriate onchain action.

**How it works:**
1. User types or speaks a command (e.g., "Send 0.01 BNB to 0x...")
2. Gemini AI parses the message and extracts the transaction intent
3. ChainMate displays a confirmation prompt with transaction details
4. User confirms -> wallet popup appears -> transaction executes onchain
5. Transaction hash is displayed with a link to BscScan

**Supported commands:**

| Command | Example | What Happens |
|---------|---------|-------------|
| Send BNB | "Send 0.01 BNB to 0x..." | Direct BNB transfer |
| Send tokens | "Send 50 CMT to 0x..." | ERC20 token transfer |
| Swap tokens | "Swap 0.1 BNB to USDT" | PancakeSwap V2 swap |
| Schedule payment | "Schedule 0.5 BNB to 0x... in 24 hours" | Time-locked onchain payment |
| Conditional payment | "Pay 1 BNB to 0x... if price above 0.01" | Price-triggered onchain payment |
| Create team | "Create team Dev with 0x... and 0x..., require 2 approvals" | Multi-sig team onchain |
| Add contact | "Add contact Alice with address 0x..." | Save contact onchain |
| Check balance | "Check my balance" | Live BNB + CMT balances |
| Address reputation | "Check reputation of 0x..." | Onchain reputation score |
| Claim faucet | "Claim faucet tokens" | Get 100 CMT test tokens |

### 2. Token Swap (PancakeSwap Integration)
Swap any supported token pair through natural language.

- Integrated with **PancakeSwap V2 Router** on BSC Testnet
- Automatic token approval handling
- Price quote shown before confirmation
- 2% slippage tolerance
- Multi-hop routing through WBNB when needed
- Supported tokens: BNB, WBNB, CMT, USDT, BUSD, DAI

**Example:** "Swap 0.1 BNB to USDT" -> Shows quote -> Confirm -> Executes swap onchain

### 3. Scheduled Payments (Onchain)
Create time-locked payments that execute at a future time.

- Natural language time parsing ("in 24 hours", "tomorrow", "in 30 minutes")
- Stored onchain via `createScheduledPayment()` smart contract function
- Supports BNB and ERC20 tokens
- Cancellable before execution

**Smart contract function:**
```solidity
function createScheduledPayment(
    address to,
    address token,
    uint256 amount,
    uint256 executeAt,
    string memory memo
) external returns (uint256)
```

### 4. Conditional Payments (Onchain)
Create payments that trigger based on price conditions.

- Set price thresholds (above/below)
- Stored onchain via `createConditionalPayment()` smart contract function
- Natural language: "Pay 0.5 BNB to 0x... if price goes above 600"

**Smart contract function:**
```solidity
function createConditionalPayment(
    address to,
    address token,
    uint256 amount,
    uint256 priceThreshold,
    bool isAboveThreshold,
    string memory memo
) external returns (uint256)
```

### 5. Team Creation & Multi-Sig
Create teams with multiple members and approval workflows.

- Onchain team creation with member addresses
- Configurable required approvals threshold
- Multi-signature transaction support

**Smart contract function:**
```solidity
function createTeam(
    string memory name,
    address[] memory members,
    uint256 requiredApprovals
) external returns (uint256)
```

### 6. Contact Management
Save, organize, and verify transaction recipients.

- **Add contacts** with name, address, and group
- **Contact groups:** Family, Team, Business, Friends
- **Onchain verification** via smart contract (`verifyContact()`)
- **Address reputation check** before verification (flags suspicious addresses)
- **Search & filter** by name, address, or group
- **Persistent storage** via localStorage

### 7. Risk Assessment & Scam Detection
Every transfer is analyzed before execution.

- **Address reputation** queried from smart contract (`getAddressReputation()`)
  - Transaction count tracking
  - Flagged address detection
  - Risk level scoring (low/medium/high)
- **AI-powered risk analysis** via Gemini
  - Analyzes transaction amount, recipient, and reputation data
  - Returns specific warnings and suggestions
- Warnings displayed before confirmation prompt

### 8. Voice Commands
Speak commands instead of typing them.

- Uses **Web Speech API** (Chrome/Edge)
- Click mic button -> speak -> text appears in input
- Works with all supported commands
- Visual feedback: mic button pulses red while listening

### 9. Analytics Dashboard (Live Data)
Real-time insights from your wallet and transaction history.

- **Wallet balances** fetched live from BSC Testnet (BNB + CMT)
- **Transaction history** with type indicators and BscScan links
- **7-day spending trend** chart computed from real data
- **Top recipients** ranked by transaction count and volume
- **Refresh button** to pull latest data
- All data persists via localStorage

### 10. Transaction History
Complete record of all transactions made through ChainMate.

- Stored in localStorage (persists across page refreshes)
- Records: type, from, to, amount, token, tx hash, timestamp
- Displayed in Analytics Dashboard with color-coded type indicators
- Direct links to BscScan for each transaction
- Up to 200 transactions stored

### 11. QR Code Generation
Generate and share QR codes for addresses and payments.

- **Address QR codes** for receiving payments
- **Payment QR codes** with embedded amount
- Download and share functionality
- API route: `POST /api/qr/generate`

### 12. Transaction Receipt Download
Download a styled PNG receipt after any successful transaction.

- **Canvas-based** receipt generation (no external dependencies)
- Dark-themed styled layout with ChainMate branding
- Includes: transaction type, amount, recipient, tx hash, timestamp, BscScan link
- One-click download button appears next to "View on BscScan" link
- File named `chainmate-receipt-<txHash>.png`

### 13. Chat History Persistence
Chat messages survive page refreshes.

### 14. AI Wallet Analyzer
Analyze any wallet address without connecting a wallet.

- **No wallet connection required** — uses public BSC Testnet RPC
- **Paste any address** and get a comprehensive breakdown
- **Data fetched in parallel** via `Promise.allSettled` for resilience:
  - BNB balance
  - Token balances (CMT, BUSD, USDT, DAI, BNB)
  - Transaction count (nonce)
  - Wallet type detection (EOA vs smart contract)
  - Recent transactions (last 25 via BSCScan API)
  - ChainMate onchain reputation (`getAddressReputation()`)
- **AI-powered analysis** via Gemini covering:
  - Portfolio assessment & token diversification
  - Activity patterns & transaction frequency
  - Risk assessment (Low/Medium/High)
  - Compromise indicators
  - Onchain reputation summary
  - Actionable recommendations
- **Recent transactions table** with BSCScan links, direction indicators, and timestamps
- **Stat cards**: BNB Balance, Tx Count, Risk Level, Wallet Age

- All messages saved to localStorage
- Automatically restored on page load
- "Clear chat" button to reset history

---

## Smart Contract Features

### ChainMateCore Contract
| Function | Description |
|----------|-------------|
| `createScheduledPayment()` | Create time-locked payment |
| `executeScheduledPayment()` | Execute when time reached |
| `cancelScheduledPayment()` | Cancel before execution |
| `createConditionalPayment()` | Create price-triggered payment |
| `addContact()` | Save contact onchain |
| `verifyContact()` | Mark contact as verified |
| `createTeam()` | Create multi-sig team |
| `getAddressReputation()` | Get tx count + flagged status |
| `getUserScheduledPayments()` | List user's scheduled payments |
| `getUserConditionalPayments()` | List user's conditional payments |

### ChainMateToken (CMT) Contract
| Function | Description |
|----------|-------------|
| `transfer()` | ERC20 token transfer |
| `approve()` | Approve spender |
| `balanceOf()` | Check token balance |
| `faucet()` | Claim 100 CMT test tokens |

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or any Web3 wallet
- BSC Testnet BNB (from [BSC Testnet Faucet](https://testnet.bnbchain.org/faucet-smart))

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Chainmate-.git
cd Chainmate-

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys (see Environment Variables below)

# Run development server
npm run dev
```

### Environment Variables

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Gemini AI API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=97

# Contract Addresses (deployed on BSC Testnet)
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=0xFc4EDCF2CA8068b2A750Ad4507297aba0807CdC5
NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=0x962A00d762692F8692B90914577d5191e79a514b

# Deployment (for contract deployment only)
PRIVATE_KEY=your_deployer_private_key
```

### Deploy Contracts (Optional)

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
Chainmate-/
├── app/
│   ├── page.tsx                    # Main app page with sidebar navigation
│   ├── layout.tsx                  # Root layout with providers
│   └── api/
│       ├── ai/chat/route.ts       # AI chat API route
│       └── qr/generate/route.ts   # QR code generation API
├── components/
│   ├── ChatInterface.tsx           # AI chat with all transaction types
│   ├── AnalyticsDashboard.tsx      # Live analytics with chain data
│   ├── ContactsManager.tsx         # Contact management with groups
│   ├── AIAnalyzer.tsx              # AI wallet analyzer (no wallet needed)
│   ├── WalletButton.tsx            # Privy wallet connection
│   ├── QRCodeModal.tsx             # QR code display
│   └── TransactionConfirmDialog.tsx # Transaction confirmation UI
├── hooks/
│   └── useChainMateContract.ts     # All blockchain interactions
├── lib/
│   ├── aiService.ts                # Gemini AI integration + intent extraction
│   ├── walletAnalyzer.ts           # Public RPC wallet analysis (no wallet needed)
│   ├── storage.ts                  # localStorage persistence layer
│   ├── receipt.ts                  # Canvas-based PNG receipt generator
│   └── utils.ts                    # Utility functions
├── config/
│   ├── contracts.ts                # Contract addresses + token registry
│   ├── chains.ts                   # BSC chain definitions
│   └── wagmi.ts                    # Wagmi configuration
├── providers/
│   └── Web3Provider.tsx            # Privy + Wagmi + React Query providers
├── types/
│   └── index.ts                    # TypeScript interfaces
├── contracts/
│   ├── ChainMateCore.sol           # Main contract (payments, teams, contacts)
│   └── ChainMateToken.sol          # CMT ERC20 token with faucet
├── scripts/
│   └── deploy.js                   # Hardhat deployment script
└── DOCUMENTATION.md                # This file
```

---

## How AI Intent Extraction Works

1. User message is sent to **Google Gemini 2.5 Flash** for natural language understanding
2. In parallel, a **regex-based intent extractor** parses the message for:
   - Transaction type (send, swap, schedule, conditional, team, etc.)
   - Amount and token symbol
   - Recipient address (0x...)
   - Time expressions ("in 24 hours", "tomorrow")
   - Price conditions ("if price above 0.01")
   - Team details (name, members, approvals)
3. The AI response is shown to the user as conversational text
4. The extracted intent triggers the appropriate onchain action flow

---

## Security Features

- **Pre-transaction risk assessment** using onchain reputation + AI analysis
- **Address flagging** via smart contract `getAddressReputation()`
- **Confirmation required** before every transaction
- **Wallet chain verification** ensures BSC Testnet before transacting
- **Address format validation** on contact creation
- **Token approval management** for swap operations
- **Slippage protection** (2%) on all swaps

---

## AI Tools Used

This project was built using AI-assisted development:
- **Claude Code** - Architecture, implementation, debugging
- **Google Gemini 2.5 Flash** - Runtime AI for natural language processing

---

## License

MIT
