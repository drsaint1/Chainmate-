'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, Users, ArrowUpRight } from 'lucide-react'
import { AnalyticsData } from '@/types'

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTransactions: 0,
    totalSpent: 0,
    totalReceived: 0,
    topRecipients: [],
    spendingByDay: [],
    tokenBalances: [],
  })

  useEffect(() => {
    
    setAnalytics({
      totalTransactions: 42,
      totalSpent: 15.5,
      totalReceived: 8.2,
      topRecipients: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', count: 12, total: '5.5' },
        { address: '0x892d35Cc6634C0532925a3b844Bc9e7595f0aAa', count: 8, total: '3.2' },
        { address: '0x342d35Cc6634C0532925a3b844Bc9e7595f0bBb', count: 5, total: '2.1' },
      ],
      spendingByDay: [
        { date: '2024-02-07', amount: 2.5 },
        { date: '2024-02-08', amount: 3.1 },
        { date: '2024-02-09', amount: 1.8 },
        { date: '2024-02-10', amount: 4.2 },
        { date: '2024-02-11', amount: 2.9 },
        { date: '2024-02-12', amount: 3.7 },
        { date: '2024-02-13', amount: 1.5 },
      ],
      tokenBalances: [
        { token: 'BNB', balance: '12.5' },
        { token: 'CMT', balance: '1500.0' },
        { token: 'USDT', balance: '250.0' },
      ],
    })
  }, [])

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{title}</span>
        <Icon className="w-5 h-5 text-emerald-500" />
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        {change && (
          <div className="flex items-center gap-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h2>
        <p className="text-gray-400 text-sm">Track your transaction activity and insights</p>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Transactions"
          value={analytics.totalTransactions}
          change="+12% vs last week"
          trend="up"
          icon={Activity}
        />
        <StatCard
          title="Total Spent"
          value={`${analytics.totalSpent} BNB`}
          change="+8% vs last week"
          trend="up"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Received"
          value={`${analytics.totalReceived} BNB`}
          change="-5% vs last week"
          trend="down"
          icon={TrendingDown}
        />
      </div>

      
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Top Recipients
          </h3>
        </div>
        <div className="space-y-3">
          {analytics.topRecipients.map((recipient, idx) => (
            <div
              key={recipient.address}
              className="flex items-center justify-between p-3 bg-gray-900 rounded-lg"
            >
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
      </div>

      
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.tokenBalances.map((token) => (
            <div
              key={token.token}
              className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-gray-400 text-sm">{token.token}</p>
                <p className="text-white text-xl font-bold">{token.balance}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">7-Day Spending Trend</h3>
        <div className="flex items-end justify-between h-40 gap-2">
          {analytics.spendingByDay.map((day, idx) => {
            const maxAmount = Math.max(...analytics.spendingByDay.map((d) => d.amount))
            const height = (day.amount / maxAmount) * 100

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg hover:from-emerald-600 hover:to-emerald-500 transition-all cursor-pointer relative group"
                    style={{ height: `${height}%` }}
                  >
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-gray-900 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  )
}
