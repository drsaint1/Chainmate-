import { GoogleGenerativeAI } from '@google/generative-ai'
import { TransactionIntent } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are ChainMate, an AI assistant for blockchain transactions on BSC (Binance Smart Chain).

You help users with:
1. Sending tokens/BNB to addresses or contacts
2. Scheduling future payments
3. Creating conditional payments based on price
4. Managing contacts and teams
5. Analyzing transaction history
6. Providing transaction insights

When users request transactions, extract:
- Action type: send, schedule, conditional, swap
- Recipient address or contact name
- Amount and token (default to BNB if not specified)
- Timing (for scheduled payments)
- Conditions (for conditional payments)

Always confirm transaction details before execution.
Be helpful, clear, and security-conscious.

Respond in a friendly, conversational tone.`

export class AIService {
  private model
  private chatHistory: Array<{ role: string; parts: Array<{ text: string }> }> = []

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })
  }

  async processMessage(userMessage: string): Promise<{
    response: string
    intent?: TransactionIntent
    suggestions?: string[]
  }> {
    try {
      this.chatHistory.push({
        role: 'user',
        parts: [{ text: userMessage }],
      })

      const chat = this.model.startChat({
        history: this.chatHistory,
      })

      const result = await chat.sendMessage(userMessage)
      const responseText = result.response.text()

      this.chatHistory.push({
        role: 'model',
        parts: [{ text: responseText }],
      })

      
      const intent = this.extractIntent(userMessage, responseText)

      
      const suggestions = this.generateSuggestions(responseText)

      return {
        response: responseText,
        intent,
        suggestions,
      }
    } catch (error) {
      console.error('AI Service Error:', error)
      return {
        response: "I'm having trouble processing that request. Could you please rephrase?",
      }
    }
  }

  private extractIntent(userMessage: string, aiResponse: string): TransactionIntent | undefined {
    const lowerMessage = userMessage.toLowerCase()

    
    if (lowerMessage.includes('send') || lowerMessage.includes('transfer') || lowerMessage.includes('pay')) {
      const amountMatch = userMessage.match(/(\d+\.?\d*)\s*(bnb|cmt|usdt|busd)?/i)
      const addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/)

      if (amountMatch) {
        return {
          type: 'send',
          amount: amountMatch[1],
          token: amountMatch[2]?.toUpperCase() || 'BNB',
          recipient: addressMatch?.[0],
        }
      }
    }

    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('tomorrow') || lowerMessage.includes('later') || lowerMessage.includes('in')) {
      return {
        type: 'schedule',
      }
    }

    
    if (lowerMessage.includes('if') || lowerMessage.includes('when') || lowerMessage.includes('price')) {
      return {
        type: 'conditional',
      }
    }

    
    if (lowerMessage.includes('swap') || lowerMessage.includes('exchange') || lowerMessage.includes('trade')) {
      return {
        type: 'swap',
      }
    }

    return undefined
  }

  private generateSuggestions(aiResponse: string): string[] {
    const suggestions = [
      "Send 10 BNB to 0x...",
      "Show my transaction history",
      "Schedule payment for tomorrow",
      "Check my balance",
      "Add a new contact",
    ]

    return suggestions.slice(0, 3)
  }

  clearHistory() {
    this.chatHistory = []
  }

  async analyzeTransaction(transactionData: {
    to: string
    amount: string
    token: string
  }): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    warnings: string[]
    suggestions: string[]
  }> {
    try {
      const prompt = `Analyze this transaction for security risks:
To: ${transactionData.to}
Amount: ${transactionData.amount} ${transactionData.token}

Provide:
1. Risk level (low/medium/high)
2. Any warnings
3. Security suggestions

Respond in JSON format.`

      const result = await this.model.generateContent(prompt)
      const text = result.response.text()

      
      return {
        riskLevel: 'low',
        warnings: [],
        suggestions: ['Always verify the recipient address', 'Start with a small test transaction'],
      }
    } catch (error) {
      return {
        riskLevel: 'medium',
        warnings: ['Unable to perform automated risk analysis'],
        suggestions: ['Manually verify the transaction details'],
      }
    }
  }

  async generateAnalytics(transactions: any[]): Promise<string> {
    try {
      const prompt = `Analyze these transactions and provide insights:
${JSON.stringify(transactions, null, 2)}

Provide:
1. Spending patterns
2. Most frequent recipients
3. Recommendations
4. Unusual activity alerts

Be concise and actionable.`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      return 'Unable to generate analytics at this time.'
    }
  }
}

export const aiService = new AIService()
