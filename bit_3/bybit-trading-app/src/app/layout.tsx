import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bybit Trading App',
  description: 'Real-time trading on Bybit testnet',
}

import { TradingProvider } from '@/context/TradingContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TradingProvider>
          {children}
        </TradingProvider>
      </body>
    </html>
  )
}