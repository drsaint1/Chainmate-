'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, Users, ArrowUpRight, Clock, RefreshCw } from 'lucide-react'
import { AnalyticsData, TransactionRecord } from '@/types'
import { useChainMateContract } from '@/hooks/useChainMateContract'
import { CONTRACTS } from '@/config/contracts'
import { storage } from '@/lib/storage'

export function AnalyticsDashboard() {
  const { getWalletAddress, getBalance, getTokenBalance } = useChainMateContract()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTransactions: 0,
    totalSpent: 0,
    totalReceived: 0,
    topRecipients: [],
    spendingByDay: [],
    tokenBalances: [],
  })
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // Load transaction history from localStorage
      const txs = storage.getTransactions()
      setTransactions(txs)

      // Compute analytics from real transaction data
      const totalSpent = txs
        .filter(tx => tx.type === 'send' || tx.type === 'schedule')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)

      // Compute top recipients
      const recipientMap = new Map<string, { count: number; total: number }>()
      txs.forEach(tx => {
        if (tx.to && tx.to !== 'faucet') {
          const existing = recipientMap.get(tx.to) || { count: 0, total: 0 }
          existing.count++
          existing.total += parseFloat(tx.amount || '0')
          recipientMap.set(tx.to, existing)
        }
      })
      const topRecipients = Array.from(recipientMap.entries())
        .map(([address, data]) => ({ address, count: data.count, total: data.total.toFixed(4) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Compute spending by day (last 7 days)
      const now = Date.now()
      const spendingByDay = Array.from({ length: 7 }, (_, i) => {
        const dayStart = now - (6 - i) * 86400000
        const dayEnd = dayStart + 86400000
        const dayTxs = txs.filter(tx => tx.timestamp >= dayStart && tx.timestamp < dayEnd)
        const amount = dayTxs.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)
        return {
          date: new Date(dayStart).toISOString().split('T')[0],
          amount: parseFloat(amount.toFixed(4)),
        }
      })

      // Fetch real balances from chain
      let tokenBalances: { token: string; balance: string }[] = []
      try {
        const addr = await getWalletAddress()
        const bnbBal = await getBalance(addr)
        const cmtBal = await getTokenBalance(CONTRACTS.CHAINMATE_TOKEN, addr)
        tokenBalances = [
          { token: 'BNB', balance: parseFloat(bnbBal).toFixed(6) },
          { token: 'CMT', balance: parseFloat(cmtBal).toFixed(2) },
        ]
      } catch {
        tokenBalances = [
          { token: 'BNB', balance: 'Connect wallet' },
          { token: 'CMT', balance: 'Connect wallet' },
        ]
      }

      setAnalytics({
        totalTransactions: txs.length,
        totalSpent: parseFloat(totalSpent.toFixed(6)),
        totalReceived: 0,
        topRecipients,
        spendingByDay,
        tokenBalances,
      })
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const StatCard = ({ title, value, icon: Icon }: any) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{title}</span>
        <Icon className="w-5 h-5 text-emerald-500" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
          <p className="text-gray-400 text-sm">Real-time data from your wallet and transaction history</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Transactions" value={analytics.totalTransactions} icon={Activity} />
        <StatCard title="Total Spent" value={`${analytics.totalSpent} BNB`} icon={TrendingUp} />
        <StatCard title="Token Balances" value={`${analytics.tokenBalances.length} tokens`} icon={ArrowUpRight} />
      </div>

      {/* Token Balances - Real */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Wallet Balances (Live)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.tokenBalances.map((token) => (
            <div
              key={token.token}
              className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-400 text-sm">{token.token}</p>
                <p className="text-white text-xl font-bold">{token.balance}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <span className="text-emerald-500 font-bold text-sm">{token.token.charAt(0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Recipients */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-emerald-500" />
          Top Recipients
        </h3>
        {analytics.topRecipients.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet. Start sending to see recipients here.</p>
        ) : (
          <div className="space-y-3">
            {analytics.topRecipients.map((recipient, idx) => (
              <div key={recipient.address} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-mono text-sm">
                      {recipient.address.slice(0, 6)}...{recipient.address.slice(-4)}
                    </p>
                    <p className="text-gray-400 text-xs">{recipient.count} transactions</p>
                  </div>
                </div>
                <p className="text-white font-medium">{recipient.total} BNB</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending Trend */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">7-Day Spending Trend</h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {analytics.spendingByDay.map((day, idx) => {
            const maxAmount = Math.max(...analytics.spendingByDay.map(d => d.amount), 0.001)
            const height = Math.max((day.amount / maxAmount) * 100, 2)

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg hover:from-emerald-600 hover:to-emerald-500 transition-all cursor-pointer relative group"
                    style={{ height: `${height}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-gray-900 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.amount} BNB
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Transaction History */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-emerald-500" />
          Recent Transactions
        </h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions recorded yet. Use the chat to make your first transaction.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.slice(0, 20).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    tx.type === 'send' ? 'bg-blue-500/20 text-blue-400' :
                    tx.type === 'schedule' ? 'bg-purple-500/20 text-purple-400' :
                    tx.type === 'conditional' ? 'bg-yellow-500/20 text-yellow-400' :
                    tx.type === 'faucet' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tx.type.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm">{tx.amount} {tx.token}</p>
                    <p className="text-gray-500 text-xs">
                      {tx.to === 'faucet' ? 'Faucet claim' : `To: ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <a
                    href={`https://testnet.bscscan.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    View
                  </a>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
