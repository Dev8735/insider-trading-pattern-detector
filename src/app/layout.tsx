import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ApiStatusProvider } from '@/context/ApiStatusContext'
import { AppShell } from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'TradeWatch — Insider Trading Monitor',
  description:
    'Monitoring and pattern detection for insider trading activity across NSE & BSE listed companies.',
}

export const viewport: Viewport = {
  themeColor: '#fbfbfa',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans">
        <ApiStatusProvider>
          <AppShell>{children}</AppShell>
        </ApiStatusProvider>
      </body>
    </html>
  )
}
