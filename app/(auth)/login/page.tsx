'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.push('/home')
  }, [status, router])

  async function handleLogin() {
    setLoading(true)
    await signIn('google', { callbackUrl: '/home' })
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center px-6">
      {/* Fundo com grade sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm gap-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-[#a78bfa]">SQL</span>
            <span className="text-white">Quest</span>
          </h1>
          <p className="text-white/50 text-base">Aprenda SQL do básico ao avançado</p>
        </div>

        {/* Features rápidas */}
        <div className="w-full space-y-2">
          {[
            { emoji: '🎮', text: 'Micro-lições gamificadas' },
            { emoji: '⚡', text: 'Execute SQL no browser, sem instalar nada' },
            { emoji: '🏅', text: 'Certificados por trilha' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f1117] border border-[#1e2028]">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-white/70 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Botão Google */}
        <div className="w-full space-y-3">
          <Button onClick={handleLogin} loading={loading} fullWidth size="lg">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </Button>
          <p className="text-center text-white/25 text-xs">
            Ao entrar você concorda com nossos termos de uso.
          </p>
        </div>
      </div>
    </div>
  )
}
