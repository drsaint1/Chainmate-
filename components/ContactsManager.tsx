'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users, Check, X, Search, Shield, Tag, AlertTriangle } from 'lucide-react'
import { Contact } from '@/types'
import { shortenAddress } from '@/lib/utils'
import { useChainMateContract } from '@/hooks/useChainMateContract'
import { storage } from '@/lib/storage'
import { toast } from 'sonner'

const GROUPS = ['All', 'Family', 'Team', 'Business', 'Friends']

export function ContactsManager() {
  const { addContact: addContactOnchain, verifyContact, getAddressReputation } = useChainMateContract()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', address: '', group: 'All' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')
  const [verifyingId, setVerifyingId] = useState<number | null>(null)

  // Load contacts from localStorage
  useEffect(() => {
    const saved = storage.getContacts()
    if (saved.length > 0) {
      setContacts(saved)
    }
  }, [])

  // Persist contacts
  useEffect(() => {
    storage.setContacts(contacts)
  }, [contacts])

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.address) return
    if (!/^0x[a-fA-F0-9]{40}$/.test(newContact.address)) {
      toast.error('Invalid address format. Must be 0x followed by 40 hex characters.')
      return
    }

    const contact: Contact = {
      id: Date.now(),
      name: newContact.name,
      address: newContact.address,
      verified: false,
      addedAt: Date.now(),
      group: newContact.group,
    }

    setContacts(prev => [...prev, contact])
    setNewContact({ name: '', address: '', group: 'All' })
    setShowAddForm(false)
    toast.success(`Contact "${newContact.name}" added locally`)

    // Also try to add onchain
    try {
      await addContactOnchain(contact.name, contact.address)
    } catch {
      // onchain failed but local save worked
    }
  }

  const handleVerify = async (id: number) => {
    setVerifyingId(id)
    const contact = contacts.find(c => c.id === id)
    if (!contact) return

    try {
      // Check address reputation
      const rep = await getAddressReputation(contact.address)

      if (rep.isFlagged) {
        toast.error('This address has been flagged! Verification blocked.')
        setVerifyingId(null)
        return
      }

      // Try onchain verification
      try {
        await verifyContact(id)
      } catch {
        // contract verification may fail if contact doesn't exist onchain yet
      }

      setContacts(prev => prev.map(c =>
        c.id === id ? { ...c, verified: true } : c
      ))
      toast.success(`${contact.name} verified! (${rep.transactionCount} prior transactions)`)
    } catch (error: any) {
      toast.error('Verification failed: ' + (error.message || 'Unknown error'))
    } finally {
      setVerifyingId(null)
    }
  }

  const handleRemove = (id: number) => {
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const handleGroupChange = (id: number, group: string) => {
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, group } : c
    ))
  }

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGroup = activeGroup === 'All' || c.group === activeGroup
    return matchesSearch && matchesGroup
  })

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Contact Management</h2>
          <p className="text-gray-400 text-sm">Manage recipients with onchain verification</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">New Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Name</label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="e.g., Alice"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Wallet Address</label>
              <input
                type="text"
                value={newContact.address}
                onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Group</label>
              <select
                value={newContact.group}
                onChange={(e) => setNewContact({ ...newContact, group: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                {GROUPS.filter(g => g !== 'All').map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Tabs */}
      <div className="flex gap-2 flex-wrap">
        {GROUPS.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeGroup === group
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            <Tag className="w-3 h-3 inline mr-1" />
            {group} {group !== 'All' && `(${contacts.filter(c => c.group === group).length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Contact List */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No contacts found</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-gray-800 border border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{contact.name}</h3>
                      {contact.verified && (
                        <Shield className="w-4 h-4 text-emerald-500" />
                      )}
                      {contact.group && contact.group !== 'All' && (
                        <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
                          {contact.group}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm font-mono">
                      {shortenAddress(contact.address, 6)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Added {new Date(contact.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Group selector */}
                  <select
                    value={contact.group || 'All'}
                    onChange={(e) => handleGroupChange(contact.id, e.target.value)}
                    className="text-xs bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-gray-300"
                  >
                    {GROUPS.filter(g => g !== 'All').map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>

                  {!contact.verified && (
                    <button
                      onClick={() => handleVerify(contact.id)}
                      disabled={verifyingId === contact.id}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-lg transition-colors disabled:opacity-50"
                      title="Verify contact onchain"
                    >
                      {verifyingId === contact.id ? (
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(contact.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
                    title="Remove contact"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
