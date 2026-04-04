import type { Metadata } from 'next'
import { Syne, JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from './providers'
import Script from 'next/script'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'SQLQuest — Aprenda SQL jogando',
  description: 'Plataforma gamificada de ensino de SQL. Do básico ao avançado.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${syne.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="theme-color" content="#080a0f" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className="bg-[#080a0f] text-white font-syne antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
