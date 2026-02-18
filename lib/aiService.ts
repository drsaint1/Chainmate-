import { GoogleGenerativeAI } from '@google/generative-ai'
import { TransactionIntent, WalletAnalysisData } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `You are ChainMate, an AI assistant for blockchain transactions on BSC (Binance Smart Chain).

You help users with:
1. Sending tokens/BNB to addresses or contacts
2. Scheduling future payments (time-locked onchain)
3. Creating conditional payments based on price thresholds
4. Swapping tokens via PancakeSwap (e.g., BNB to USDT, CMT to BNB)
5. Managing contacts and teams
6. Checking balances and address reputation
7. Analyzing transaction history
8. Claiming tokens from the faucet

When users request transactions, extract:
- Action type: send, schedule, conditional, swap, team, balance, contact, reputation, faucet
- Recipient address or contact name
- Amount and token (default to BNB if not specified)
- Timing (for scheduled payments - convert to hours from now)
- Conditions (for conditional payments - price threshold and direction)

Examples of what users might say:
- "Send 0.01 BNB to 0x123..." → send transaction
- "Schedule 0.5 BNB to 0x123... in 24 hours" → scheduled payment
- "Pay 1 BNB to 0x123... if BNB price goes above 0.01" → conditional payment
- "Create team Dev with 0x123... and 0x456..., require 2 approvals" → team creation
- "Check my balance" → balance check
- "Check reputation of 0x123..." → reputation check
- "Claim faucet tokens" → faucet claim
- "Add Alice as contact with address 0x123..." → add contact
- "Swap 0.1 BNB to USDT" → token swap via PancakeSwap
- "Exchange 50 USDT for BNB" → token swap

Important context:
- Contact names are resolved automatically from saved contacts. Do NOT ask for addresses if a contact name is provided.
- Dollar amounts ($5, $10) are treated as USDT automatically.
- Keep responses SHORT. Do not repeat transaction details the system will display.
- If a user provides enough info (amount + recipient or contact name), just confirm briefly.
Be helpful, clear, and security-conscious.`

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
      const suggestions = this.generateSuggestions(intent?.type)

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
    const addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/)

    // Parse amounts: handle "$5" as "5 USDT" (unless an explicit token follows like "$20 BNB")
    let parsedAmount: string | undefined
    let parsedToken: string | undefined
    const dollarWithToken = userMessage.match(/\$(\d+\.?\d*)\s+(bnb|cmt|usdt|busd|wbnb|dai)/i)
    const dollarOnly = userMessage.match(/\$(\d+\.?\d*)/i)
    if (dollarWithToken) {
      // "$20 BNB" → amount 20, token BNB (explicit token overrides USDT default)
      parsedAmount = dollarWithToken[1]
      parsedToken = dollarWithToken[2].toUpperCase()
    } else if (dollarOnly) {
      parsedAmount = dollarOnly[1]
      parsedToken = 'USDT'
    } else {
      const normalMatch = userMessage.match(/(\d+\.?\d*)\s*(bnb|cmt|usdt|busd|wbnb|dai)?/i)
      if (normalMatch) {
        parsedAmount = normalMatch[1]
        parsedToken = normalMatch[2]?.toUpperCase()
      }
    }

    // Faucet claim
    if (lowerMessage.includes('faucet') || lowerMessage.includes('claim')) {
      return { type: 'faucet' }
    }

    // Balance check
    if (lowerMessage.includes('balance') || lowerMessage.includes('how much')) {
      return {
        type: 'balance',
        recipient: addressMatch?.[0],
      }
    }

    // Address reputation
    if (lowerMessage.includes('reputation') || lowerMessage.includes('risk') || lowerMessage.includes('check address')) {
      return {
        type: 'reputation',
        recipient: addressMatch?.[0],
      }
    }

    // Add contact
    if (lowerMessage.includes('add contact') || lowerMessage.includes('save contact') || lowerMessage.includes('add') && lowerMessage.includes('contact')) {
      const nameMatch = userMessage.match(/(?:add|save)\s+(?:contact\s+)?(\w+)/i)
      return {
        type: 'contact',
        contactName: nameMatch?.[1],
        recipient: addressMatch?.[0],
      }
    }

    // Team creation
    if (lowerMessage.includes('create team') || lowerMessage.includes('new team')) {
      const teamNameMatch = userMessage.match(/(?:create|new)\s+team\s+(\w+)/i)
      const allAddresses = userMessage.match(/0x[a-fA-F0-9]{40}/g) || []
      const approvalsMatch = userMessage.match(/(\d+)\s*approval/i)
      return {
        type: 'team',
        teamName: teamNameMatch?.[1] || 'My Team',
        teamMembers: allAddresses,
        requiredApprovals: approvalsMatch ? parseInt(approvalsMatch[1]) : Math.ceil(allAddresses.length / 2),
      }
    }

    // Extract contact name from message (e.g., "send to James", "pay Alice")
    const contactNameMatch = userMessage.match(/(?:to|pay|for)\s+([A-Z][a-z]+)/i)
    const mentionedContactName = contactNameMatch?.[1]

    // Scheduled payment — check BEFORE basic send
    // Detect time patterns: "in 20 mins", "after 20secs", "after 1 hour", "in 2 days"
    const timePattern = /(?:in|after)\s*(\d+)\s*(second|sec|minute|min|hour|hr|day)s?/i
    const hasTimeDelay = lowerMessage.match(timePattern)
    if ((lowerMessage.includes('schedule') || lowerMessage.includes('tomorrow') || lowerMessage.includes('later') ||
         lowerMessage.includes('after') || hasTimeDelay) && parsedAmount) {
      let hoursFromNow = 24 // default: 24 hours
      const timeMatch = userMessage.match(timePattern)
      if (timeMatch) {
        const num = parseInt(timeMatch[1])
        const unit = timeMatch[2].toLowerCase()
        if (unit.startsWith('day')) hoursFromNow = num * 24
        else if (unit.startsWith('sec')) hoursFromNow = num / 3600
        else if (unit.startsWith('min')) hoursFromNow = num / 60
        else hoursFromNow = num
      } else if (lowerMessage.includes('tomorrow')) {
        hoursFromNow = 24
      }

      const executeAt = Math.floor(Date.now() / 1000) + Math.floor(hoursFromNow * 3600)

      // Format readable delay
      let delayLabel: string
      if (hoursFromNow < 1 / 60) delayLabel = `${Math.round(hoursFromNow * 3600)}s from now`
      else if (hoursFromNow < 1) delayLabel = `${Math.round(hoursFromNow * 60)}m from now`
      else delayLabel = `${hoursFromNow}h from now`

      return {
        type: 'schedule',
        amount: parsedAmount,
        token: parsedToken || 'BNB',
        recipient: addressMatch?.[0],
        contactName: mentionedContactName,
        executeAt,
        memo: `Scheduled payment - ${delayLabel}`,
      }
    }

    // Conditional payment
    if ((lowerMessage.includes('if') || lowerMessage.includes('when') || lowerMessage.includes('condition')) &&
        (lowerMessage.includes('price') || lowerMessage.includes('above') || lowerMessage.includes('below')) && parsedAmount) {
      const thresholdMatch = userMessage.match(/(?:above|below|over|under|>|<)\s*(\d+\.?\d*)/i)
      const isAbove = lowerMessage.includes('above') || lowerMessage.includes('over') || lowerMessage.includes('>')
      return {
        type: 'conditional',
        amount: parsedAmount,
        token: parsedToken || 'BNB',
        recipient: addressMatch?.[0],
        contactName: mentionedContactName,
        priceThreshold: thresholdMatch?.[1] || '0',
        isAboveThreshold: isAbove,
        memo: `Conditional: execute when price ${isAbove ? 'above' : 'below'} ${thresholdMatch?.[1] || '?'}`,
      }
    }

    // Basic send
    if (lowerMessage.includes('send') || lowerMessage.includes('transfer') || lowerMessage.includes('pay')) {
      if (parsedAmount) {
        return {
          type: 'send',
          amount: parsedAmount,
          token: parsedToken || 'BNB',
          recipient: addressMatch?.[0],
          contactName: mentionedContactName,
        }
      }
    }

    // Swap: "swap 0.1 BNB to USDT", "exchange 5 USDT for BNB", "trade 10 CMT to BNB"
    if (lowerMessage.includes('swap') || lowerMessage.includes('exchange') || lowerMessage.includes('trade')) {
      // Pattern: "swap <amount> <fromToken> to/for <toToken>"
      const swapMatch = userMessage.match(/(?:swap|exchange|trade)\s+(\d+\.?\d*)\s*(bnb|cmt|usdt|busd|wbnb|dai)\s+(?:to|for|into)\s+(bnb|cmt|usdt|busd|wbnb|dai)/i)
      if (swapMatch) {
        return {
          type: 'swap',
          amount: swapMatch[1],
          fromToken: swapMatch[2].toUpperCase(),
          toToken: swapMatch[3].toUpperCase(),
        }
      }
      // Fallback: "swap <fromToken> to <toToken>" without amount
      const swapPairMatch = userMessage.match(/(?:swap|exchange|trade)\s*(bnb|cmt|usdt|busd|wbnb|dai)\s+(?:to|for|into)\s+(bnb|cmt|usdt|busd|wbnb|dai)/i)
      if (swapPairMatch) {
        return {
          type: 'swap',
          fromToken: swapPairMatch[1].toUpperCase(),
          toToken: swapPairMatch[2].toUpperCase(),
          amount: parsedAmount,
        }
      }
      return { type: 'swap' }
    }

    return undefined
  }

  private generateSuggestions(intentType?: string): string[] {
    if (intentType === 'send') {
      return ['Check my balance', 'Schedule a payment', 'View transaction history']
    }
    if (intentType === 'balance') {
      return ['Send tokens', 'Claim faucet', 'View analytics']
    }
    return [
      'Send 0.01 BNB to 0x...',
      'Schedule payment for tomorrow',
      'Check my balance',
    ]
  }

  clearHistory() {
    this.chatHistory = []
  }

  async analyzeWalletComprehensive(data: WalletAnalysisData): Promise<string> {
    try {
      const tokenSummary = data.tokenBalances
        .filter((t) => parseFloat(t.balance) > 0)
        .map((t) => `${t.symbol}: ${parseFloat(t.balance).toFixed(4)}`)
        .join(', ') || 'None with balance'

      const recentTxSummary = data.recentTransactions.slice(0, 10).map((tx) => {
        const direction = tx.from.toLowerCase() === data.address.toLowerCase() ? 'OUT' : 'IN'
        const value = parseFloat(tx.value) / 1e18
        return `${direction} ${value.toFixed(4)} BNB ${tx.isError === '1' ? '(FAILED)' : ''}`
      }).join('\n')

      const walletAge = data.firstTxTimestamp
        ? `${Math.floor((Date.now() / 1000 - data.firstTxTimestamp) / 86400)} days`
        : 'Unknown'

      const prompt = `You are a blockchain security analyst. Analyze this BSC Testnet wallet and provide a comprehensive assessment. Keep it under 500 words, use markdown formatting.

**Wallet:** ${data.address}
**Type:** ${data.isContract ? 'Smart Contract' : 'Externally Owned Account (EOA)'}
**BNB Balance:** ${parseFloat(data.bnbBalance).toFixed(4)} BNB
**Token Holdings:** ${tokenSummary}
**Outgoing Tx Count (nonce):** ${data.transactionCount}
**Wallet Age:** ${walletAge}
**Recent Transactions (last 10):**
${recentTxSummary || 'No transactions found'}
**ChainMate Reputation:** ${data.reputation ? `Tx Count: ${data.reputation.transactionCount}, Flagged: ${data.reputation.isFlagged}` : 'Not registered'}

Provide analysis covering:
1. **Portfolio Assessment** - Token diversification, balance health
2. **Activity Pattern** - Transaction frequency, direction (sender vs receiver)
3. **Risk Assessment** - Overall risk level (Low/Medium/High) with reasoning
4. **Compromise Indicators** - Any signs of wallet compromise or suspicious patterns
5. **Onchain Reputation** - What the history tells us about this wallet
6. **Recommendations** - Actionable suggestions for this wallet holder`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Wallet analysis error:', error)
      return 'Unable to generate AI analysis at this time. Please try again later.'
    }
  }

  async analyzeSmartContract(data: WalletAnalysisData): Promise<string> {
    try {
      if (!data.contractSource?.sourceCode) {
        return `## Contract Analysis — No Source Code

This address is a **smart contract**, but its source code is **not verified** on BSCScan.

Without verified source code, a full security audit cannot be performed. This is itself a risk indicator — legitimate projects typically verify their contracts.

**What you can still observe:**
- **BNB Balance:** ${parseFloat(data.bnbBalance).toFixed(4)} BNB
- **Transaction Count:** ${data.transactionCount}
- Check the contract bytecode and interactions on [BSCScan](https://testnet.bscscan.com/address/${data.address})

**Recommendation:** Exercise caution when interacting with unverified contracts. Consider verifying the contract source on BSCScan or contacting the deployer.`
      }

      let sourceCode = data.contractSource.sourceCode
      const truncated = sourceCode.length > 15000
      if (truncated) {
        sourceCode = sourceCode.slice(0, 15000)
      }

      const prompt = `You are a smart contract security auditor. Analyze the following Solidity contract source code and provide a detailed security audit. Keep your response under 800 words, use markdown formatting.

**Contract Name:** ${data.contractSource.contractName}
**Compiler:** ${data.contractSource.compilerVersion}
**Optimization:** ${data.contractSource.optimizationUsed ? `Yes (${data.contractSource.runs} runs)` : 'No'}
**EVM Version:** ${data.contractSource.evmVersion || 'default'}
**License:** ${data.contractSource.licenseType || 'Unknown'}
**Proxy:** ${data.contractSource.proxy ? 'Yes' : 'No'}
${data.contractSource.proxy && data.contractSource.implementation ? `**Implementation:** ${data.contractSource.implementation}` : ''}
${truncated ? '\n**Note:** Source code was truncated to 15000 characters. Analyze what is available.\n' : ''}

**Source Code:**
\`\`\`solidity
${sourceCode}
\`\`\`

Provide analysis covering:
1. **Contract Overview** — Name, purpose, architecture pattern (e.g., proxy, ownable, ERC-20)
2. **Security Vulnerabilities** — Check for: reentrancy, integer overflow/underflow, unchecked external calls, access control issues, front-running risks, tx.origin usage, delegatecall risks, storage collisions, denial of service vectors
3. **Code Quality** — Design patterns used, readability, documentation, upgradability considerations
4. **Risk Rating** — Assign one: Safe / Caution / Dangerous — with clear reasoning
5. **Recommendations** — Specific actionable improvements`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Smart contract analysis error:', error)
      return 'Unable to generate smart contract security analysis at this time. Please try again later.'
    }
  }

  async analyzeTransaction(transactionData: {
    to: string
    amount: string
    token: string
    reputation?: { transactionCount: number; isFlagged: boolean; riskLevel: string }
  }): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    warnings: string[]
    suggestions: string[]
  }> {
    try {
      const prompt = `Analyze this blockchain transaction for security risks. Respond ONLY with valid JSON, no markdown.
To: ${transactionData.to}
Amount: ${transactionData.amount} ${transactionData.token}
Address reputation: ${transactionData.reputation ? `${transactionData.reputation.transactionCount} prior transactions, flagged: ${transactionData.reputation.isFlagged}` : 'unknown'}

Respond with this exact JSON format:
{"riskLevel":"low","warnings":[],"suggestions":["tip1","tip2"]}`

      const result = await this.model.generateContent(prompt)
      const text = result.response.text()

      // Try to parse AI response as JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          riskLevel: parsed.riskLevel || 'medium',
          warnings: parsed.warnings || [],
          suggestions: parsed.suggestions || [],
        }
      }

      return {
        riskLevel: transactionData.reputation?.isFlagged ? 'high' : 'medium',
        warnings: transactionData.reputation?.isFlagged ? ['This address has been flagged'] : [],
        suggestions: ['Verify the recipient address', 'Start with a small test amount'],
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
      const prompt = `Analyze these blockchain transactions and provide brief insights in 3-4 bullet points:
${JSON.stringify(transactions.slice(0, 20), null, 2)}

Cover: spending patterns, most frequent recipients, recommendations. Be concise.`

      const result = await this.model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      return 'Unable to generate analytics at this time.'
    }
  }
}

export const aiService = new AIService()
