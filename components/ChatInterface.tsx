'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, MicOff, Loader2, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { downloadReceipt } from '@/lib/receipt'
import { aiService } from '@/lib/aiService'
import { Message, TransactionIntent } from '@/types'
import { cn } from '@/lib/utils'
import { useChainMateContract } from '@/hooks/useChainMateContract'
import { CONTRACTS, TOKEN_ADDRESSES } from '@/config/contracts'
import { storage } from '@/lib/storage'
import { ethers } from 'ethers'

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: "Hi! I'm ChainMate, your AI companion for BSC transactions. I can help you:\n\n" +
    "- Send BNB/tokens to any address\n" +
    "- Swap tokens (e.g., BNB to USDT via PancakeSwap)\n" +
    "- Schedule future payments\n" +
    "- Create conditional payments (price-based)\n" +
    "- Create teams with multi-sig\n" +
    "- Check balances & address reputation\n" +
    "- Claim faucet tokens\n\nWhat would you like to do?",
  timestamp: Date.now(),
}

export function ChatInterface() {
  const {
    getWalletAddress, sendTransaction, sendToken, schedulePayment,
    createConditionalPayment, addContact, createTeam, getBalance,
    getTokenBalance, claimFromFaucet, getAddressReputation,
    getSwapQuote, swapTokens,
  } = useChainMateContract()

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingIntent, setPendingIntent] = useState<TransactionIntent | null>(null)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Load chat history from localStorage
  useEffect(() => {
    const saved = storage.getMessages()
    if (saved.length > 0) {
      setMessages(saved)
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 1) {
      storage.setMessages(messages)
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...msg,
      id: (Date.now() + Math.random()).toString(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

  const recordTransaction = useCallback((type: string, to: string, amount: string, token: string, txHash: string, memo?: string) => {
    storage.addTransaction({
      id: (Date.now() + Math.random()).toString(),
      type: type as any,
      from: 'self',
      to,
      amount,
      token,
      txHash,
      timestamp: Date.now(),
      status: 'success',
      memo,
    })
  }, [])

  // Resolve contact name to address from saved contacts
  const resolveContact = useCallback((name?: string): string | undefined => {
    if (!name) return undefined
    const contacts = storage.getContacts()
    const match = contacts.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    )
    return match?.address
  }, [])

  // Resolve recipient: use address if provided, otherwise look up contact name
  const resolveRecipient = useCallback((intent: TransactionIntent): TransactionIntent => {
    if (intent.recipient) return intent
    if (intent.contactName) {
      const address = resolveContact(intent.contactName)
      if (address) {
        return { ...intent, recipient: address }
      }
    }
    return intent
  }, [resolveContact])

  // Execute the confirmed transaction based on intent type
  const executeTransaction = async (intent: TransactionIntent) => {
    addMessage({ role: 'assistant', content: '⏳ Processing... Please confirm in your wallet.' })

    try {
      let txHash: string
      let summary: string

      switch (intent.type) {
        case 'send': {
          if (intent.token === 'BNB' || !intent.token) {
            txHash = await sendTransaction(intent.recipient!, intent.amount!)
          } else {
            const tokenAddress = TOKEN_ADDRESSES[intent.token!.toUpperCase()] || CONTRACTS.CHAINMATE_TOKEN
            txHash = await sendToken(intent.recipient!, intent.amount!, tokenAddress)
          }
          summary = `Sent ${intent.amount} ${intent.token || 'BNB'} to ${intent.recipient}`
          recordTransaction('send', intent.recipient!, intent.amount!, intent.token || 'BNB', txHash)
          break
        }

        case 'schedule': {
          const tokenAddr = intent.token === 'BNB' || !intent.token ? ethers.ZeroAddress : CONTRACTS.CHAINMATE_TOKEN
          txHash = await schedulePayment(
            intent.recipient!,
            tokenAddr,
            intent.amount!,
            intent.executeAt!,
            intent.memo || 'Scheduled via ChainMate'
          )
          const execDate = new Date(intent.executeAt! * 1000).toLocaleString()
          summary = `Scheduled ${intent.amount} ${intent.token || 'BNB'} to ${intent.recipient}\nExecutes at: ${execDate}`
          recordTransaction('schedule', intent.recipient!, intent.amount!, intent.token || 'BNB', txHash, intent.memo)
          break
        }

        case 'conditional': {
          const condTokenAddr = intent.token === 'BNB' || !intent.token ? ethers.ZeroAddress : CONTRACTS.CHAINMATE_TOKEN
          txHash = await createConditionalPayment(
            intent.recipient!,
            condTokenAddr,
            intent.amount!,
            intent.priceThreshold || '0',
            intent.isAboveThreshold ?? true,
            intent.memo || 'Conditional via ChainMate'
          )
          summary = `Conditional payment created: ${intent.amount} ${intent.token || 'BNB'} to ${intent.recipient}\nCondition: price ${intent.isAboveThreshold ? 'above' : 'below'} ${intent.priceThreshold}`
          recordTransaction('conditional', intent.recipient!, intent.amount!, intent.token || 'BNB', txHash, intent.memo)
          break
        }

        case 'team': {
          txHash = await createTeam(
            intent.teamName || 'My Team',
            intent.teamMembers || [],
            intent.requiredApprovals || 1
          )
          summary = `Team "${intent.teamName}" created with ${intent.teamMembers?.length || 0} members\nRequired approvals: ${intent.requiredApprovals}`
          recordTransaction('team', '', '0', 'BNB', txHash)
          break
        }

        case 'contact': {
          txHash = await addContact(intent.contactName || 'Unknown', intent.recipient!)
          summary = `Contact "${intent.contactName}" (${intent.recipient}) added onchain`
          break
        }

        case 'swap': {
          // Get quote first for minimum output (2% slippage tolerance)
          const quote = await getSwapQuote(intent.fromToken!, intent.toToken!, intent.amount!)
          const minOut = (parseFloat(quote.amountOut) * 0.98).toString()
          txHash = await swapTokens(intent.fromToken!, intent.toToken!, intent.amount!, minOut)
          summary = `Swapped ${intent.amount} ${intent.fromToken} for ~${parseFloat(quote.amountOut).toFixed(6)} ${intent.toToken}`
          recordTransaction('swap', 'PancakeSwap', intent.amount!, `${intent.fromToken}->${intent.toToken}`, txHash)
          break
        }

        case 'faucet': {
          txHash = await claimFromFaucet()
          summary = 'Claimed 100 CMT tokens from faucet'
          recordTransaction('faucet', 'faucet', '100', 'CMT', txHash)
          break
        }

        default:
          throw new Error('Unsupported transaction type')
      }

      addMessage({
        role: 'assistant',
        content: `✅ ${summary}\n\nTx Hash: ${txHash}`,
        transactionHash: txHash,
        status: 'success',
      })
    } catch (error: any) {
      addMessage({
        role: 'assistant',
        content: `❌ Transaction failed: ${error.message || 'Unknown error'}`,
        status: 'error',
      })
    }
  }

  // Build confirmation message for a given intent
  const buildConfirmMessage = (intent: TransactionIntent): string => {
    switch (intent.type) {
      case 'send': {
        const recipientLabel = intent.contactName
          ? `${intent.contactName} (${intent.recipient})`
          : intent.recipient
        return `Please confirm this transaction:\n\n💰 Amount: ${intent.amount} ${intent.token || 'BNB'}\n📍 To: ${recipientLabel}\n\nReply with "confirm" to proceed or "cancel" to abort.`
      }
      case 'schedule':
        return `Please confirm this scheduled payment:\n\n💰 Amount: ${intent.amount} ${intent.token || 'BNB'}\n📍 To: ${intent.recipient}\n⏰ Execute at: ${new Date((intent.executeAt || 0) * 1000).toLocaleString()}\n📝 ${intent.memo}\n\nReply with "confirm" to proceed or "cancel" to abort.`
      case 'conditional':
        return `Please confirm this conditional payment:\n\n💰 Amount: ${intent.amount} ${intent.token || 'BNB'}\n📍 To: ${intent.recipient}\n📊 Condition: price ${intent.isAboveThreshold ? 'above' : 'below'} ${intent.priceThreshold}\n\nReply with "confirm" to proceed or "cancel" to abort.`
      case 'team':
        return `Please confirm team creation:\n\n👥 Team: ${intent.teamName}\n👤 Members: ${intent.teamMembers?.length || 0}\n✅ Required approvals: ${intent.requiredApprovals}\n\nReply with "confirm" to proceed or "cancel" to abort.`
      case 'contact':
        return `Please confirm adding contact:\n\n👤 Name: ${intent.contactName}\n📍 Address: ${intent.recipient}\n\nReply with "confirm" to proceed or "cancel" to abort.`
      case 'swap':
        return `Please confirm this swap:\n\n🔄 Swap: ${intent.amount} ${intent.fromToken} -> ${intent.toToken}\n📊 Via PancakeSwap (2% slippage tolerance)\n\nReply with "confirm" to proceed or "cancel" to abort.`
      case 'faucet':
        return `Claim 100 CMT tokens from the faucet?\n\nReply with "confirm" to proceed or "cancel" to abort.`
      default:
        return 'Confirm this action? Reply "confirm" or "cancel".'
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      // Handle confirmation
      if (pendingIntent && (currentInput.toLowerCase().includes('confirm') || currentInput.toLowerCase().includes('yes'))) {
        const intent = pendingIntent
        setPendingIntent(null)
        await executeTransaction(intent)
        setIsLoading(false)
        return
      }

      // Handle cancellation
      if (pendingIntent && (currentInput.toLowerCase().includes('cancel') || currentInput.toLowerCase().includes('no'))) {
        setPendingIntent(null)
        addMessage({ role: 'assistant', content: '❌ Transaction cancelled. How else can I help you?' })
        setIsLoading(false)
        return
      }

      // Process through AI
      const { response, intent } = await aiService.processMessage(currentInput)

      // Only show AI's conversational response if there's no actionable intent
      // (prevents AI saying "give me the address" when we can resolve it ourselves)
      if (!intent) {
        addMessage({ role: 'assistant', content: response })
      }

      // Handle non-transactional intents immediately
      if (intent?.type === 'balance') {
        try {
          const addr = intent.recipient || await getWalletAddress()
          const bnbBalance = await getBalance(addr)
          const cmtBalance = await getTokenBalance(CONTRACTS.CHAINMATE_TOKEN, addr)
          addMessage({
            role: 'assistant',
            content: `💰 Balances for ${addr.slice(0, 6)}...${addr.slice(-4)}:\n\n• BNB: ${parseFloat(bnbBalance).toFixed(6)}\n• CMT: ${parseFloat(cmtBalance).toFixed(2)}`,
          })
        } catch (e: any) {
          addMessage({ role: 'assistant', content: `Could not fetch balance: ${e.message}` })
        }
        setIsLoading(false)
        return
      }

      if (intent?.type === 'reputation') {
        try {
          const addr = intent.recipient
          if (!addr) {
            addMessage({ role: 'assistant', content: 'Please provide an address to check. Example: "Check reputation of 0x..."' })
          } else {
            const rep = await getAddressReputation(addr)
            const riskColor = rep.riskLevel === 'high' ? '🔴' : rep.riskLevel === 'medium' ? '🟡' : rep.riskLevel === 'low' ? '🟢' : '⚪'
            addMessage({
              role: 'assistant',
              content: `🔍 Address Reputation for ${addr.slice(0, 6)}...${addr.slice(-4)}:\n\n${riskColor} Risk Level: ${rep.riskLevel.toUpperCase()}\n📊 Transaction Count: ${rep.transactionCount}\n🚩 Flagged: ${rep.isFlagged ? 'YES - CAUTION' : 'No'}`,
            })
          }
        } catch (e: any) {
          addMessage({ role: 'assistant', content: `Could not fetch reputation: ${e.message}` })
        }
        setIsLoading(false)
        return
      }

      // Handle swap intent — get quote first, then ask for confirmation
      if (intent?.type === 'swap') {
        if (!intent.fromToken || !intent.toToken || !intent.amount) {
          addMessage({ role: 'assistant', content: 'Please specify the full swap. Example: "Swap 0.1 BNB to USDT"' })
          setIsLoading(false)
          return
        }
        try {
          const quote = await getSwapQuote(intent.fromToken, intent.toToken, intent.amount)
          addMessage({
            role: 'assistant',
            content: `📊 Swap Quote:\n${intent.amount} ${intent.fromToken} ≈ ${parseFloat(quote.amountOut).toFixed(6)} ${intent.toToken}\n\nRoute: ${quote.path.length} hops via PancakeSwap`,
          })
        } catch (e: any) {
          addMessage({ role: 'assistant', content: `Could not get swap quote: ${e.message}` })
        }
        setPendingIntent(intent)
        addMessage({
          role: 'assistant',
          content: buildConfirmMessage(intent),
          requiresConfirmation: true,
        })
        setIsLoading(false)
        return
      }

      // Handle transactional intents — require confirmation
      if (intent && ['send', 'schedule', 'conditional', 'team', 'contact', 'faucet'].includes(intent.type)) {
        // Resolve contact name -> address
        const resolved = resolveRecipient(intent)

        // If we need a recipient but don't have one, ask for it
        if (['send', 'schedule', 'conditional'].includes(resolved.type) && !resolved.recipient) {
          const contactHint = resolved.contactName
            ? `I couldn't find "${resolved.contactName}" in your saved contacts. `
            : ''
          addMessage({
            role: 'assistant',
            content: `${contactHint}Please provide the wallet address (0x...) or save the contact first.`,
          })
          setIsLoading(false)
          return
        }

        // Use the resolved intent from here
        const finalIntent = resolved

        // Run risk assessment for transfers
        if (finalIntent.recipient && ['send', 'schedule', 'conditional'].includes(finalIntent.type)) {
          try {
            const rep = await getAddressReputation(finalIntent.recipient!)
            const risk = await aiService.analyzeTransaction({
              to: finalIntent.recipient!,
              amount: finalIntent.amount || '0',
              token: finalIntent.token || 'BNB',
              reputation: rep,
            })
            if (risk.warnings.length > 0) {
              addMessage({
                role: 'assistant',
                content: `⚠️ Risk Assessment (${risk.riskLevel.toUpperCase()}):\n${risk.warnings.map(w => `• ${w}`).join('\n')}`,
              })
            }
          } catch {
            // risk check failed, proceed anyway
          }
        }

        setPendingIntent(finalIntent)
        addMessage({
          role: 'assistant',
          content: buildConfirmMessage(finalIntent),
          requiresConfirmation: true,
        })
      }
    } catch (error) {
      console.error('Error:', error)
      addMessage({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleConfirmAction = (action: 'confirm' | 'cancel') => {
    setInput(action)
    setTimeout(() => {
      handleSend()
    }, 0)
  }

  // Voice input with Web Speech API
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      addMessage({ role: 'assistant', content: 'Voice input is not supported in this browser. Try Chrome or Edge.' })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  const clearHistory = () => {
    setMessages([INITIAL_MESSAGE])
    storage.setMessages([])
    aiService.clearHistory()
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 shadow-lg',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                  : message.requiresConfirmation
                  ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 text-gray-100 border border-yellow-600'
                  : message.status === 'error'
                  ? 'bg-red-900/30 text-gray-100 border border-red-700'
                  : message.status === 'success'
                  ? 'bg-emerald-900/30 text-gray-100 border border-emerald-700'
                  : 'bg-gray-800 text-gray-100 border border-gray-700'
              )}
            >
              <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap m-0">{message.content}</p>
                ) : (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                )}
              </div>

              {message.requiresConfirmation && pendingIntent && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleConfirmAction('confirm')}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleConfirmAction('cancel')}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {message.transactionHash && (
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href={`https://testnet.bscscan.com/tx/${message.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-300 hover:text-blue-200 underline"
                  >
                    View on BscScan
                  </a>
                  <button
                    onClick={() => downloadReceipt({
                      txHash: message.transactionHash!,
                      content: message.content,
                      timestamp: message.timestamp,
                    })}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Receipt
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-3 border border-gray-700">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4 bg-gray-800/50 backdrop-blur">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-emerald-500 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Try: 'Send 0.01 BNB to 0x...', 'Schedule payment', 'Check balance'"
              className="w-full bg-transparent text-white px-4 py-3 rounded-2xl resize-none focus:outline-none"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleVoiceInput}
            className={cn(
              'p-3 rounded-full transition-colors',
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            )}
            disabled={isLoading}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['Send tokens', 'Swap BNB to USDT', 'Check balance', 'Schedule payment', 'Claim faucet'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
          <button
            onClick={clearHistory}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-red-600/50 text-gray-400 rounded-full transition-colors"
          >
            Clear chat
          </button>
        </div>
      </div>
    </div>
  )
}
