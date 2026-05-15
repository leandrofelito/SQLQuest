import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from './providers'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://sqlquest.com.br'),
  title: 'SQLQuest — Aprenda SQL jogando',
  description: 'Plataforma gamificada de ensino de SQL. Do básico ao avançado.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/brand/logooficialSQLQUESTpng-Photoroom.png', sizes: '512x512', type: 'image/png' },
      { url: '/brand/logooficialSQLQUESTpng-Photoroom.png', sizes: '64x64', type: 'image/png' },
      { url: '/brand/logooficialSQLQUESTpng-Photoroom.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/brand/logooficialSQLQUESTpng-Photoroom.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    title: 'SQLQuest — Aprenda SQL jogando',
    description: 'Plataforma gamificada de ensino de SQL. Do básico ao avançado.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SQLQuest — Aprenda SQL jogando',
    description: 'Plataforma gamificada de ensino de SQL. Do básico ao avançado.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="theme-color" content="#080a0f" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        {/* PWA / TWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SQLQuest" />
        {/* favicon: metadata.icons (PNG — SVG com <image> externo falha na aba em vários browsers) */}
        {/* AdSense é carregado no cliente somente após consentimento de publicidade. */}
      </head>
      <body className="bg-[#080a0f] text-white font-syne antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
