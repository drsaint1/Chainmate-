'use client'

import { TransactionIntent } from '@/types'
import { shortenAddress } from '@/lib/utils'

interface TransactionConfirmDialogProps {
  intent: TransactionIntent
  onConfirm: () => void
  onCancel: () => void
}

export function TransactionConfirmDialog({
  intent,
  onConfirm,
  onCancel,
}: TransactionConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Confirm Transaction</h3>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400 text-sm">Type</span>
            <span className="text-white font-medium capitalize">{intent.type}</span>
          </div>

          {intent.recipient && (
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400 text-sm">To</span>
              <span className="text-white font-mono text-sm">
                {shortenAddress(intent.recipient)}
              </span>
            </div>
          )}

          {intent.amount && (
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400 text-sm">Amount</span>
              <span className="text-white font-medium">
                {intent.amount} {intent.token || 'BNB'}
              </span>
            </div>
          )}

          {intent.memo && (
            <div className="flex justify-between items-start py-2 border-b border-gray-700">
              <span className="text-gray-400 text-sm">Memo</span>
              <span className="text-white text-sm text-right">{intent.memo}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
