export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  transactionHash?: string
  status?: 'pending' | 'success' | 'error'
}

export interface Contact {
  id: number
  name: string
  address: string
  verified: boolean
  addedAt: number
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
  type: 'send' | 'swap' | 'schedule' | 'conditional' | 'team'
  recipient?: string
  amount?: string
  token?: string
  executeAt?: number
  condition?: string
  memo?: string
}

export interface AnalyticsData {
  totalTransactions: number
  totalSpent: number
  totalReceived: number
  topRecipients: { address: string; count: number; total: string }[]
  spendingByDay: { date: string; amount: number }[]
  tokenBalances: { token: string; balance: string }[]
}
