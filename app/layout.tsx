import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from './providers'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'SQLQuest — Aprenda SQL jogando',
  description: 'Plataforma gamificada de ensino de SQL. Do básico ao avançado.',
  manifest: '/manifest.json',
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/icone_app.svg" sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        {/* Google AdSense */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4150729063109368"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-[#080a0f] text-white font-syne antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
