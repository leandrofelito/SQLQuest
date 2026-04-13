'use client'
import { useState, useMemo } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { contemPalavrão } from '@/lib/nickname'

// ── Força da senha ──────────────────────────────────────────────────
interface PasswordCheck {
  label: string
  ok: boolean
}

function getPasswordChecks(p: string): PasswordCheck[] {
  return [
    { label: 'Mínimo 8 caracteres',       ok: p.length >= 8 },
    { label: 'Letra maiúscula',            ok: /[A-Z]/.test(p) },
    { label: 'Letra minúscula',            ok: /[a-z]/.test(p) },
    { label: 'Número',                     ok: /[0-9]/.test(p) },
    { label: 'Caractere especial (!@#…)',  ok: /[^A-Za-z0-9]/.test(p) },
  ]
}

function getStrength(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0
  const checks = getPasswordChecks(p)
  const passed = checks.filter(c => c.ok).length
  if (passed <= 1) return 1
  if (passed === 2) return 2
  if (passed === 3 || passed === 4) return 3
  return 4 // all 5
}

const STRENGTH_META = [
  { label: '',       color: '' },
  { label: 'Fraca',    color: '#ef4444' },
  { label: 'Razoável', color: '#f97316' },
  { label: 'Boa',      color: '#eab308' },
  { label: 'Forte',    color: '#22c55e' },
] as const
// ────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [showChecks, setShowChecks] = useState(false)

  const checks = useMemo(() => getPasswordChecks(form.password), [form.password])
  const strength = useMemo(() => getStrength(form.password), [form.password])
  const allChecksPassed = checks.every(c => c.ok)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErro('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!allChecksPassed) {
      setErro('A senha não atende aos requisitos de segurança')
      return
    }
    if (form.password !== form.confirm) {
      setErro('As senhas não coincidem')
      return
    }
    // Validação antecipada no cliente — evita round-trip desnecessário
    if (contemPalavrão(form.nickname)) {
      setErro('Este nickname não é permitido. Escolha outro.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          nickname: form.nickname,
          email: form.email,
          password: form.password,
        }),
        signal: AbortSignal.timeout(12_000),
      })

      let data: Record<string, string> = {}
      try { data = await res.json() } catch { /* corpo não-JSON — ignora */ }

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao criar conta. Tente novamente.')
        return
      }

      setEmailEnviado(true)
    } catch (err: unknown) {
      const isTimeout =
        err instanceof DOMException &&
        (err.name === 'TimeoutError' || err.name === 'AbortError')
      setErro(
        isTimeout
          ? 'A requisição demorou demais. Verifique sua conexão e tente novamente.'
          : 'Erro de conexão. Verifique sua internet e tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  const meta = STRENGTH_META[strength]

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center px-6 pt-10">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center pt-2 pb-0">
          <img
            src="/icons/sqlquest_logo_escrita.svg"
            alt="SQLQuest"
            className="w-[65%] max-w-[280px] h-auto"
          />
        </div>
        <p className="text-white/40 text-sm text-center -mt-4">Crie sua conta gratuita</p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nome e Sobrenome lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5">Nome</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="João"
                required
                autoComplete="given-name"
                maxLength={25}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-medium block mb-1.5">Sobrenome</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Silva"
                required
                autoComplete="family-name"
                maxLength={25}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">
              Nickname <span className="text-white/25 font-normal">(aparece no ranking)</span>
            </label>
            <input
              type="text"
              value={form.nickname}
              onChange={e => set('nickname', e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              onBlur={() => {
                if (form.nickname.length >= 3 && contemPalavrão(form.nickname)) {
                  setErro('Este nickname não é permitido. Escolha outro.')
                }
              }}
              placeholder="joaosilva_sql"
              required
              autoComplete="username"
              maxLength={20}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />
            <p className="text-white/25 text-xs mt-1 ml-1">Letras, números e _ · 3 a 20 caracteres</p>
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

          {/* Senha com indicador de força */}
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={e => { set('password', e.target.value); setShowChecks(true) }}
              onFocus={() => setShowChecks(true)}
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              maxLength={72}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />

            {/* Barra de força */}
            {form.password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: strength >= level ? meta.color : '#1e2028',
                      }}
                    />
                  ))}
                  <span
                    className="text-xs font-semibold ml-1 w-14 text-right transition-colors duration-300"
                    style={{ color: meta.color || '#ffffff30' }}
                  >
                    {meta.label}
                  </span>
                </div>

                {/* Checklist */}
                {showChecks && (
                  <div className="bg-[#0f1117] border border-[#1e2028] rounded-xl px-3 py-2.5 space-y-1">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className={`text-xs transition-colors duration-200 ${c.ok ? 'text-emerald-400' : 'text-white/25'}`}>
                          {c.ok ? '✓' : '○'}
                        </span>
                        <span className={`text-xs transition-colors duration-200 ${c.ok ? 'text-white/60' : 'text-white/25'}`}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              maxLength={72}
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

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            className="mt-2"
            disabled={form.password.length > 0 && !allChecksPassed}
          >
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
        <p className="text-center text-white/25 text-xs pb-16 pt-2">
          <Link href="/privacidade" className="hover:text-white/40 underline underline-offset-2">
            Política de privacidade
          </Link>
        </p>
      </div>
    </div>
  )
}
