import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UPSA Birthday Wishes',
  description: 'Birthday wishes application for UPSA',
  icons: {
    icon: '/download.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
