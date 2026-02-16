import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const { data, type } = await request.json()

    if (!data) {
      return NextResponse.json({ error: 'Data is required' }, { status: 400 })
    }

    
    let qrData = data

    if (type === 'payment') {
      
      const { to, amount, token } = data
      qrData = `ethereum:${to}?value=${amount}&token=${token}`
    } else if (type === 'address') {
      qrData = `ethereum:${data.address}`
    }

    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#10b981',
        light: '#ffffff',
      },
    })

    return NextResponse.json({ qrCode: qrCodeDataUrl })
  } catch (error: any) {
    console.error('QR Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error.message },
      { status: 500 }
    )
  }
}
