'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, Loader2 } from 'lucide-react'
import { aiService } from '@/lib/aiService'
import { Message } from '@/types'
import { cn } from '@/lib/utils'

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm ChainMate, your AI companion for BSC transactions. I can help you send tokens, schedule payments, manage contacts, and analyze your transaction history. What would you like to do?",
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingIntent, setPendingIntent] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsLoading(true)

    try {
      
      if (pendingIntent && (currentInput.toLowerCase().includes('confirm') || currentInput.toLowerCase().includes('yes'))) {
        setPendingIntent(null)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: '✅ Transaction confirmed! Processing your request...',
            timestamp: Date.now(),
          },
        ])
        setIsLoading(false)
        return
      }

      if (pendingIntent && (currentInput.toLowerCase().includes('cancel') || currentInput.toLowerCase().includes('no'))) {
        setPendingIntent(null)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: '❌ Transaction cancelled. How else can I help you?',
            timestamp: Date.now(),
          },
        ])
        setIsLoading(false)
        return
      }

      const { response, intent, suggestions } = await aiService.processMessage(currentInput)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      
      if (intent?.type === 'send' && intent.amount && intent.recipient) {
        setPendingIntent(intent)

        
        const confirmMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Please confirm this transaction:\n\n💰 Amount: ${intent.amount} ${intent.token}\n📍 To: ${intent.recipient}\n\nReply with "confirm" to proceed or "cancel" to abort.`,
          timestamp: Date.now(),
          requiresConfirmation: true,
        }
        setMessages((prev) => [...prev, confirmMessage])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ])
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

  const handleVoiceInput = () => {
    
    alert('Voice input feature coming soon!')
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
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
                  : 'bg-gray-800 text-gray-100 border border-gray-700'
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>

              {message.requiresConfirmation && pendingIntent && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setInput('confirm')
                      handleSend()
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ✅ Confirm
                  </button>
                  <button
                    onClick={() => {
                      setInput('cancel')
                      handleSend()
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}

              {message.transactionHash && (
                <a
                  href={`https://testnet.bscscan.com/tx/${message.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:text-blue-200 mt-2 block"
                >
                  View transaction
                </a>
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

      
      <div className="border-t border-gray-700 p-4 bg-gray-800/50 backdrop-blur">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-emerald-500 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message... (e.g., 'Send 10 BNB to 0x...')"
              className="w-full bg-transparent text-white px-4 py-3 rounded-2xl resize-none focus:outline-none"
              rows={1}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleVoiceInput}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            disabled={isLoading}
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        
        <div className="flex flex-wrap gap-2 mt-3">
          {['Send tokens', 'Check balance', 'Transaction history', 'Add contact'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
