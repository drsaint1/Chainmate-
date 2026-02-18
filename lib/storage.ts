import { Message, Contact, TransactionRecord } from '@/types'

const KEYS = {
  MESSAGES: 'chainmate_messages',
  CONTACTS: 'chainmate_contacts',
  TRANSACTIONS: 'chainmate_transactions',
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or unavailable
  }
}

export const storage = {
  getMessages: (): Message[] => safeGet(KEYS.MESSAGES, []),
  setMessages: (msgs: Message[]) => safeSet(KEYS.MESSAGES, msgs),

  getContacts: (): Contact[] => safeGet(KEYS.CONTACTS, []),
  setContacts: (contacts: Contact[]) => safeSet(KEYS.CONTACTS, contacts),

  getTransactions: (): TransactionRecord[] => safeGet(KEYS.TRANSACTIONS, []),
  setTransactions: (txs: TransactionRecord[]) => safeSet(KEYS.TRANSACTIONS, txs),
  addTransaction: (tx: TransactionRecord) => {
    const txs = safeGet<TransactionRecord[]>(KEYS.TRANSACTIONS, [])
    txs.unshift(tx)
    safeSet(KEYS.TRANSACTIONS, txs.slice(0, 200)) // keep last 200
  },
}
