'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErro('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setErro('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao criar conta')
        return
      }

      setEmailEnviado(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center px-6">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">🔍</div>
          <h1 className="text-2xl font-bold">
            <span className="text-[#a78bfa]">SQL</span>
            <span className="text-white">Quest</span>
          </h1>
          <p className="text-white/40 text-sm">Crie sua conta gratuita</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Nome completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="João Silva"
              required
              autoComplete="name"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="joao@email.com"
              required
              autoComplete="email"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>

          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Confirmar senha</label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              placeholder="Repita a senha"
              required
              autoComplete="new-password"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>

          {erro && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {erro}
            </p>
          )}

          {emailEnviado && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 space-y-1">
              <p className="text-emerald-400 text-sm font-semibold">✅ Verifique seu email!</p>
              <p className="text-emerald-300/70 text-xs leading-relaxed">
                Enviamos um link de confirmação para <strong>{form.email}</strong>. Clique no link para ativar sua conta.
              </p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
            Criar conta
          </Button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2a2d3a]" />
          <span className="text-white/25 text-xs">ou</span>
          <div className="flex-1 h-px bg-[#2a2d3a]" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/home' })}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#2a2d3a] bg-[#0f1117] text-white/70 text-sm hover:border-[#8b5cf6]/50 hover:text-white transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </button>

        <p className="text-center text-white/30 text-sm">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#a78bfa] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
