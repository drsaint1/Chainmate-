'use client'

import { useState, useEffect } from 'react'
import { QrCode, X, Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    address?: string
    to?: string
    amount?: string
    token?: string
  }
  type: 'address' | 'payment'
}

export function QRCodeModal({ isOpen, onClose, data, type }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      generateQRCode()
    }
  }, [isOpen, data])

  const generateQRCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, type }),
      })

      const result = await response.json()
      setQrCode(result.qrCode)
    } catch (error) {
      toast.error('Failed to generate QR code')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.download = `chainmate-${type}-qr.png`
    link.href = qrCode
    link.click()
    toast.success('QR code downloaded!')
  }

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        const blob = await (await fetch(qrCode)).blob()
        const file = new File([blob], 'qrcode.png', { type: 'image/png' })
        await navigator.share({
          files: [file],
          title: 'ChainMate Payment QR',
          text: 'Scan this QR code to complete the payment',
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      toast.error('Sharing not supported on this device')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-500" />
            Payment QR Code
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-6 mb-6">
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="w-full h-auto" />
              )}
            </div>

            <div className="space-y-3 mb-6">
              {type === 'payment' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">To:</span>
                    <span className="text-white font-mono">
                      {data.to?.slice(0, 10)}...{data.to?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-medium">
                      {data.amount} {data.token}
                    </span>
                  </div>
                </>
              )}
              {type === 'address' && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Your Address</p>
                  <p className="text-white font-mono text-sm break-all">
                    {data.address}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadQRCode}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
              <button
                onClick={shareQRCode}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
