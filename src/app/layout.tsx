import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EBSI Financial Freedom OS',
    template: '%s | EBSI Financial Freedom OS',
  },
  description: 'Your personal financial operating system — optimize cashflow, liquidity, passive income, and achieve financial freedom.',
  keywords: ['financial freedom', 'personal finance', 'cashflow', 'net worth', 'passive income', 'property commission'],
}

export const viewport: Viewport = {
  themeColor: '#0F0F1A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(222, 47%, 12%)',
              color: 'hsl(210, 40%, 98%)',
              border: '1px solid hsl(217, 32%, 20%)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  )
}
