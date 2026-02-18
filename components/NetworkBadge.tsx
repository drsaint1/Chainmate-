'use client'

import { useWallets } from '@privy-io/react-auth'
import { usePrivy } from '@privy-io/react-auth'
import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { CHAIN_ID } from '@/config/contracts'

const CHAIN_NAMES: Record<number, string> = {
  97: 'BSC Testnet',
  56: 'BSC Mainnet',
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
}

export function NetworkBadge() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const wallet = wallets.find(w => w.walletClientType !== 'privy') || wallets[0]
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    if (!wallet) {
      setChainId(null)
      return
    }

    // Read initial chain
    const id = typeof wallet.chainId === 'string'
      ? parseInt(wallet.chainId.replace('eip155:', ''), 10)
      : Number(wallet.chainId)
    if (id) setChainId(id)
  }, [wallet, wallet?.chainId])

  if (!authenticated || !wallet) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700">
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
        <span className="text-xs text-gray-400">Not Connected</span>
      </div>
    )
  }

  const isCorrectChain = chainId === CHAIN_ID
  const chainName = chainId ? (CHAIN_NAMES[chainId] || `Chain ${chainId}`) : 'Unknown'

  const handleSwitch = async () => {
    try {
      await wallet.switchChain(CHAIN_ID)
      setChainId(CHAIN_ID)
    } catch {
      // User rejected
    }
  }

  if (isCorrectChain) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-xs text-gray-400">BSC Testnet</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleSwitch}
      className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-900/30 rounded-lg border border-red-500/50 hover:bg-red-900/50 transition-colors"
    >
      <AlertTriangle className="w-3 h-3 text-red-400" />
      <span className="text-xs text-red-400">{chainName}</span>
      <span className="text-xs text-red-300 font-medium">Switch</span>
    </button>
  )
}
