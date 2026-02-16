'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { shortenAddress } from '@/lib/utils'

export function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { wallets } = useWallets()
  const [copied, setCopied] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const wallet = wallets[0]
  const address = wallet?.address

  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!ready) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-700 text-gray-400 rounded-xl font-medium cursor-not-allowed"
      >
        Loading...
      </button>
    )
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
      >
        <Wallet className="w-5 h-5" />
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700 flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        {address ? shortenAddress(address) : 'Connected'}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Connected Wallet</p>
            <p className="text-sm text-white font-mono">{address && shortenAddress(address, 6)}</p>
            {user?.email && (
              <p className="text-xs text-gray-400 mt-2">
                {user.email.address}
              </p>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={copyAddress}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            <button
              onClick={() => {
                logout()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
