'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const OAUTH_ERRORS: Record<string, string> = {
  OAuthCallback: 'Erro ao autenticar com Google. Tente novamente.',
  OAuthSignin: 'Erro ao iniciar login com Google. Tente novamente.',
  OAuthAccountNotLinked: 'Este email já está cadastrado com outro método de login.',
  Callback: 'Erro de callback. Tente novamente.',
  AccessDenied: 'Acesso negado.',
  Verification: 'Link de verificação inválido ou expirado. Solicite um novo cadastro.',
  Default: 'Ocorreu um erro ao fazer login. Tente novamente.',
}

function LoginForm() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [manterLogado, setManterLogado] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.push('/home')
    if (status === 'unauthenticated') localStorage.removeItem('sqlquest_force_logout')
  }, [status, router])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const verifiedParam = searchParams.get('verified')
    if (verifiedParam === '1') {
      setSucesso('Email confirmado! Agora você já pode fazer login.')
    } else if (errorParam) {
      setErro(OAUTH_ERRORS[errorParam] ?? OAUTH_ERRORS.Default)
    }
  }, [searchParams])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErro('')
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    setLoading(false)

    if (res?.ok) {
      localStorage.setItem('sqlquest_auth_v2', '1')
      if (manterLogado) {
        localStorage.setItem('sqlquest_keep_logged_in', '1')
      } else {
        localStorage.removeItem('sqlquest_keep_logged_in')
      }
      sessionStorage.setItem('sqlquest_session_active', '1')
      router.push('/home')
    } else if (res?.error === 'GoogleAccount') {
      setErro('Esta conta foi criada com Google. Use o botão "Continuar com Google" acima.')
    } else if (res?.error === 'EmailNotVerified') {
      setErro('Confirme seu email antes de fazer login. Verifique sua caixa de entrada.')
    } else {
      setErro('Email ou senha incorretos')
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

      <div className="relative z-10 w-full max-w-sm sm:max-w-md space-y-3">
        {/* Logo */}
        <div className="flex justify-center pt-2 pb-0">
          <img
            src="/icons/sqlquest_logo_escrita.svg"
            alt="SQLQuest"
            className="w-[65%] max-w-[280px] h-auto"
          />
        </div>

        {/* Google */}
        <button
          onClick={() => {
            setLoadingGoogle(true)
            // Seta flags antes do redirect para que SessionGuard não dispare signOut no retorno
            // (sessionStorage não sobrevive ao redirect OAuth externo, mas localStorage sim)
            localStorage.setItem('sqlquest_auth_v2', '1')
            localStorage.setItem('sqlquest_keep_logged_in', '1')
            signIn('google', { callbackUrl: '/home' })
          }}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-gray-800 text-sm font-semibold hover:bg-gray-100 transition-all disabled:opacity-60"
        >
          {loadingGoogle ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continuar com Google
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2a2d3a]" />
          <span className="text-white/25 text-xs">ou entre com email</span>
          <div className="flex-1 h-px bg-[#2a2d3a]" />
        </div>

        {/* Formulário email/senha */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="seu@email.com"
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
            />
          </div>

          {sucesso && (
            <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
              ✅ {sucesso}
            </p>
          )}

          {erro && status === 'unauthenticated' && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {erro}
            </p>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setManterLogado(v => !v)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                manterLogado
                  ? 'bg-[#8b5cf6] border-[#8b5cf6]'
                  : 'bg-transparent border-[#2a2d3a]'
              }`}
            >
              {manterLogado && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span
              onClick={() => setManterLogado(v => !v)}
              className="text-white/50 text-sm"
            >
              Manter logado
            </span>
          </label>

          <Button type="submit" loading={loading} fullWidth size="lg">
            Entrar
          </Button>
        </form>

        <p className="text-center text-white/30 text-sm">
          Não tem conta?{' '}
          <Link href="/register" className="text-[#a78bfa] hover:underline">
            Criar conta grátis
          </Link>
        </p>
        <p className="text-center text-white/25 text-xs pb-16 pt-2 flex justify-center gap-4">
          <Link href="/privacidade" className="hover:text-white/40 underline underline-offset-2">
            Política de privacidade
          </Link>
          <Link href="/termos" className="hover:text-white/40 underline underline-offset-2">
            Termos de uso
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
