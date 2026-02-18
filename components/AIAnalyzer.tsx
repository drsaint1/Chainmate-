'use client'

import { useState } from 'react'
import {
  Brain,
  Search,
  Wallet,
  Activity,
  ShieldAlert,
  Clock,
  Coins,
  ExternalLink,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Code2,
  Shield,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { analyzeWallet } from '@/lib/walletAnalyzer'
import { aiService } from '@/lib/aiService'
import { WalletAnalysisData } from '@/types'

export function AIAnalyzer() {
  const [searchAddress, setSearchAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletData, setWalletData] = useState<WalletAnalysisData | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [contractAnalysis, setContractAnalysis] = useState<string | null>(null)
  const [contractLoading, setContractLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)

  const handleAnalyze = async () => {
    const trimmed = searchAddress.trim()
    if (!isValidAddress(trimmed)) {
      setError('Invalid address. Must be 0x followed by 40 hex characters.')
      return
    }

    setError(null)
    setWalletData(null)
    setAiAnalysis(null)
    setContractAnalysis(null)
    setLoading(true)

    try {
      const data = await analyzeWallet(trimmed)
      setWalletData(data)
      setLoading(false)

      // Start AI analyses in parallel after data loads
      setAiLoading(true)
      const aiPromises: Promise<void>[] = []

      // Wallet analysis (always)
      aiPromises.push(
        aiService.analyzeWalletComprehensive(data)
          .then((analysis) => setAiAnalysis(analysis))
          .catch(() => setAiAnalysis('Unable to generate AI analysis.'))
      )

      // Contract security audit (only for smart contracts)
      if (data.isContract) {
        setContractLoading(true)
        aiPromises.push(
          aiService.analyzeSmartContract(data)
            .then((analysis) => setContractAnalysis(analysis))
            .catch(() => setContractAnalysis('Unable to generate contract security analysis.'))
            .finally(() => setContractLoading(false))
        )
      }

      await Promise.all(aiPromises)
      setAiLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to analyze wallet. Please try again.')
      setLoading(false)
    }
  }

  const getRiskLevel = (): { label: string; color: string } => {
    if (!walletData) return { label: '—', color: 'text-gray-400' }
    if (walletData.reputation?.isFlagged) return { label: 'High', color: 'text-red-400' }
    if (walletData.transactionCount > 50) return { label: 'Low', color: 'text-emerald-400' }
    if (walletData.transactionCount > 5) return { label: 'Medium', color: 'text-yellow-400' }
    if (walletData.transactionCount > 0) return { label: 'New', color: 'text-blue-400' }
    return { label: 'Unknown', color: 'text-gray-400' }
  }

  const getWalletAge = (): string => {
    if (!walletData?.firstTxTimestamp) {
      if (walletData && walletData.transactionCount > 0) return 'Active'
      return '—'
    }
    const days = Math.floor((Date.now() / 1000 - walletData.firstTxTimestamp) / 86400)
    if (days < 1) return '< 1 day'
    if (days < 30) return `${days} days`
    if (days < 365) return `${Math.floor(days / 30)} months`
    return `${(days / 365).toFixed(1)} years`
  }

  const risk = getRiskLevel()

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Wallet Analyzer</h2>
          <p className="text-gray-400 text-sm">
            Paste any wallet address for a comprehensive AI-powered analysis
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="0x... Enter wallet address"
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !searchAddress.trim()}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Brain className="w-5 h-5" />
          )}
          Analyze
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-20 mb-3" />
                <div className="h-6 bg-gray-700 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-32 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded w-full" />
              <div className="h-3 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {walletData && !loading && (
        <div className="space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400">BNB Balance</span>
              </div>
              <p className="text-lg font-bold text-white">
                {parseFloat(walletData.bnbBalance).toFixed(4)}
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Tx Count</span>
              </div>
              <p className="text-lg font-bold text-white">{walletData.transactionCount}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Risk Level</span>
              </div>
              <p className={`text-lg font-bold ${risk.color}`}>{risk.label}</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {walletData.isContract ? (
                  <>
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Type</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Wallet Age</span>
                  </>
                )}
              </div>
              <p className="text-lg font-bold text-white">
                {walletData.isContract ? 'Contract' : getWalletAge()}
              </p>
            </div>
          </div>

          {/* Token Holdings */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-semibold">Token Holdings</h3>
            </div>
            {walletData.tokenBalances.length > 0 ? (
              <div className="space-y-2">
                {walletData.tokenBalances.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between py-2 px-3 bg-gray-900/50 rounded-lg"
                  >
                    <span className="text-sm text-gray-300 font-medium">{token.symbol}</span>
                    <span className="text-sm text-white font-mono">
                      {parseFloat(token.balance).toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No token balances found</p>
            )}
          </div>

          {/* Contract Info Card (shown only for smart contracts) */}
          {walletData.isContract && (
            <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Contract Info</h3>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                  Smart Contract
                </span>
              </div>
              {walletData.contractSource ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Contract Name</p>
                    <p className="text-white font-bold text-sm">{walletData.contractSource.contractName}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Compiler</p>
                    <p className="text-white font-mono text-xs break-all">{walletData.contractSource.compilerVersion}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Optimization</p>
                    <p className="text-white font-bold text-sm">
                      {walletData.contractSource.optimizationUsed
                        ? `Yes (${walletData.contractSource.runs} runs)`
                        : 'No'}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">EVM Version</p>
                    <p className="text-white font-bold text-sm">{walletData.contractSource.evmVersion || 'default'}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">License</p>
                    <p className="text-white font-bold text-sm">{walletData.contractSource.licenseType || 'Unknown'}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Proxy</p>
                    <p className={`font-bold text-sm ${walletData.contractSource.proxy ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {walletData.contractSource.proxy ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <p className="text-yellow-400 text-sm font-medium">Source Code Not Verified</p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    This contract&apos;s source code is not verified on BSCScan. A full security audit requires verified source code.
                  </p>
                  <a
                    href={`https://testnet.bscscan.com/address/${walletData.address}#code`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:underline mt-2"
                  >
                    View on BSCScan <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Contract Security Audit (shown only for smart contracts) */}
          {walletData.isContract && (
            <div className="bg-gray-800 border border-amber-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-white font-semibold">Contract Security Audit</h3>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  Gemini
                </span>
              </div>
              {contractLoading ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                  <span className="text-gray-400 text-sm">Auditing contract source code...</span>
                </div>
              ) : contractAnalysis ? (
                <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                  <ReactMarkdown>{contractAnalysis}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-gray-800 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-semibold">AI Analysis</h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                Gemini
              </span>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="text-gray-400 text-sm">Generating comprehensive analysis...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            ) : null}
          </div>

          {/* Onchain Reputation */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Onchain Reputation</h3>
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                ChainMate Contract
              </span>
            </div>
            {walletData.reputation ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Contract Tx Count</p>
                  <p className="text-white font-bold">{walletData.reputation.transactionCount}</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Flagged</p>
                  <p className={`font-bold ${walletData.reputation.isFlagged ? 'text-red-400' : 'text-emerald-400'}`}>
                    {walletData.reputation.isFlagged ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Not registered in ChainMate contract
              </p>
            )}
            <div className="mt-3 bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Wallet Type</p>
              <p className="text-white font-bold">
                {walletData.isContract ? 'Smart Contract' : 'EOA (Externally Owned Account)'}
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Recent Transactions</h3>
              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                Last {walletData.recentTransactions.length}
              </span>
            </div>
            {walletData.recentTransactions.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {walletData.recentTransactions.map((tx) => {
                  const isOutgoing = tx.from.toLowerCase() === walletData.address.toLowerCase()
                  const value = parseFloat(tx.value) / 1e18
                  const date = new Date(parseInt(tx.timeStamp) * 1000)

                  return (
                    <div
                      key={tx.hash}
                      className="flex items-center justify-between py-2 px-3 bg-gray-900/50 rounded-lg gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isOutgoing ? (
                          <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 truncate">
                            {isOutgoing ? 'To' : 'From'}:{' '}
                            {(isOutgoing ? tx.to : tx.from).slice(0, 10)}...
                            {(isOutgoing ? tx.to : tx.from).slice(-6)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-sm font-mono ${
                            isOutgoing ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {isOutgoing ? '-' : '+'}{value.toFixed(4)} BNB
                        </span>
                        <a
                          href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-emerald-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No transactions returned from BSCScan</p>
                {walletData.transactionCount > 0 && (
                  <p className="text-gray-600 text-xs mt-1">
                    This wallet has {walletData.transactionCount} outgoing tx(s) by nonce.{' '}
                    <a
                      href={`https://testnet.bscscan.com/address/${walletData.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:underline"
                    >
                      View on BSCScan
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!walletData && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-gray-400 font-medium mb-2">Enter a wallet address to begin</h3>
          <p className="text-gray-600 text-sm max-w-md">
            Get token holdings, transaction history, risk assessment, onchain reputation, and
            AI-powered insights — no wallet connection required.
          </p>
        </div>
      )}
    </div>
  )
}
