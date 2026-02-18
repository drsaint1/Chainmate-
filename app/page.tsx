'use client'

import { useState } from 'react'
import { MessageSquare, BarChart3, Users, Home, Menu, X, Brain } from 'lucide-react'
import { ChatInterface } from '@/components/ChatInterface'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { ContactsManager } from '@/components/ContactsManager'
import { AIAnalyzer } from '@/components/AIAnalyzer'
import { WalletButton } from '@/components/WalletButton'
import { usePrivy } from '@privy-io/react-auth'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'contacts' | 'home' | 'analyzer'>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { authenticated } = usePrivy()

  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'chat' as const, label: 'AI Chat', icon: MessageSquare },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'contacts' as const, label: 'Contacts', icon: Users },
    { id: 'analyzer' as const, label: 'AI Analyzer', icon: Brain },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg text-gray-400"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">ChainMate</h1>
                  <p className="text-xs text-gray-400">AI Crypto Companion</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg border border-gray-700">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">BSC Testnet</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900/90 backdrop-blur border-r border-gray-800 transition-transform duration-300 pt-[73px] lg:pt-0`}
        >
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Good Vibes Hackathon</h3>
              <p className="text-xs text-gray-400">Built for BNB Chain</p>
            </div>
          </div>
        </aside>

        
        <main className="flex-1 overflow-hidden">
          {activeTab === 'home' && (
            <div className="h-full flex items-center justify-center p-6">
              <div className="max-w-2xl text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Welcome to ChainMate
                  </h2>
                  <p className="text-gray-400 text-lg mb-6">
                    Your AI-powered companion for seamless crypto transactions on BNB Smart Chain
                  </p>
                </div>

                {!authenticated ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-white mb-4">Get Started</h3>
                    <p className="text-gray-400 mb-6">Connect your wallet to start using ChainMate</p>
                    <WalletButton />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors text-left"
                    >
                      <MessageSquare className="w-8 h-8 text-emerald-500 mb-3" />
                      <h3 className="text-white font-semibold mb-2">AI Chat</h3>
                      <p className="text-gray-400 text-sm">Send tokens with natural language</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors text-left"
                    >
                      <BarChart3 className="w-8 h-8 text-emerald-500 mb-3" />
                      <h3 className="text-white font-semibold mb-2">Analytics</h3>
                      <p className="text-gray-400 text-sm">Track your transaction insights</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('contacts')}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors text-left"
                    >
                      <Users className="w-8 h-8 text-emerald-500 mb-3" />
                      <h3 className="text-white font-semibold mb-2">Contacts</h3>
                      <p className="text-gray-400 text-sm">Manage frequent recipients</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('analyzer')}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-6 transition-colors text-left"
                    >
                      <Brain className="w-8 h-8 text-purple-500 mb-3" />
                      <h3 className="text-white font-semibold mb-2">AI Analyzer</h3>
                      <p className="text-gray-400 text-sm">Analyze any wallet with AI</p>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && <ChatInterface />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'contacts' && <ContactsManager />}
          {activeTab === 'analyzer' && <AIAnalyzer />}
        </main>
      </div>
    </div>
  )
}
