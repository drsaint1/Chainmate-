export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  transactionHash?: string
  status?: 'pending' | 'success' | 'error'
  requiresConfirmation?: boolean
}

export interface Contact {
  id: number
  name: string
  address: string
  verified: boolean
  addedAt: number
  group?: string
}

export interface ScheduledPayment {
  id: number
  from: string
  to: string
  token: string
  amount: string
  executeAt: number
  executed: boolean
  cancelled: boolean
  memo: string
}

export interface ConditionalPayment {
  id: number
  from: string
  to: string
  token: string
  amount: string
  priceThreshold: string
  isAboveThreshold: boolean
  executed: boolean
  cancelled: boolean
  memo: string
}

export interface Team {
  id: number
  name: string
  creator: string
  members: string[]
  requiredApprovals: number
  active: boolean
}

export interface TransactionIntent {
  type: 'send' | 'swap' | 'schedule' | 'conditional' | 'team' | 'balance' | 'contact' | 'reputation' | 'faucet'
  recipient?: string
  amount?: string
  token?: string
  executeAt?: number
  condition?: string
  memo?: string
  priceThreshold?: string
  isAboveThreshold?: boolean
  teamName?: string
  teamMembers?: string[]
  requiredApprovals?: number
  contactName?: string
  // Swap fields
  fromToken?: string
  toToken?: string
}

export interface AnalyticsData {
  totalTransactions: number
  totalSpent: number
  totalReceived: number
  topRecipients: { address: string; count: number; total: string }[]
  spendingByDay: { date: string; amount: number }[]
  tokenBalances: { token: string; balance: string }[]
}

export interface TransactionRecord {
  id: string
  type: 'send' | 'receive' | 'schedule' | 'conditional' | 'team' | 'faucet' | 'swap'
  from: string
  to: string
  amount: string
  token: string
  txHash: string
  timestamp: number
  status: 'success' | 'failed'
  memo?: string
}

export interface BSCScanTransaction {
  blockNumber: string
  timeStamp: string
  hash: string
  from: string
  to: string
  value: string
  gas: string
  gasUsed: string
  isError: string
  functionName: string
}

export interface ContractSourceData {
  sourceCode: string
  contractName: string
  compilerVersion: string
  optimizationUsed: boolean
  runs: number
  evmVersion: string
  licenseType: string
  proxy: boolean
  implementation: string
}

export interface WalletAnalysisData {
  address: string
  bnbBalance: string
  tokenBalances: { symbol: string; balance: string; address: string }[]
  transactionCount: number
  isContract: boolean
  recentTransactions: BSCScanTransaction[]
  reputation: { transactionCount: number; isFlagged: boolean } | null
  firstTxTimestamp: number | null
  contractSource?: ContractSourceData | null
}
