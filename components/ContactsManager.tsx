'use client'

import { useState } from 'react'
import { UserPlus, Users, Check, X, Search, Shield } from 'lucide-react'
import { Contact } from '@/types'
import { shortenAddress } from '@/lib/utils'

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      name: 'Alice',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      verified: true,
      addedAt: Date.now() - 86400000,
    },
    {
      id: 2,
      name: 'Bob',
      address: '0x892d35Cc6634C0532925a3b844Bc9e7595f0aAa',
      verified: false,
      addedAt: Date.now() - 172800000,
    },
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', address: '' })
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddContact = () => {
    if (!newContact.name || !newContact.address) return

    const contact: Contact = {
      id: contacts.length + 1,
      name: newContact.name,
      address: newContact.address,
      verified: false,
      addedAt: Date.now(),
    }

    setContacts([...contacts, contact])
    setNewContact({ name: '', address: '' })
    setShowAddForm(false)
  }

  const handleVerify = (id: number) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, verified: true } : c))
  }

  const handleRemove = (id: number) => {
    setContacts(contacts.filter(c => c.id !== id))
  }

  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Contact Management</h2>
          <p className="text-gray-400 text-sm">Manage your frequent transaction recipients</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      
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
                        <Shield className="w-4 h-4 text-emerald-500" title="Verified" />
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
                  {!contact.verified && (
                    <button
                      onClick={() => handleVerify(contact.id)}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-lg transition-colors"
                      title="Verify contact"
                    >
                      <Check className="w-5 h-5" />
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
