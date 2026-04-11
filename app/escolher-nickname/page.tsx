'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { contemPalavrão } from '@/lib/nickname'

export default function EscolherNicknamePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [fase, setFase] = useState<'salvar' | 'sessao'>('salvar')

  // Se já tem nickname, vai para home
  useEffect(() => {
    if ((session?.user as any)?.nickname) {
      router.replace('/home')
    }
  }, [session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    // Validação antecipada no cliente — feedback imediato sem round-trip
    if (contemPalavrão(nickname)) {
      setErro('Este nickname não é permitido. Escolha outro.')
      return
    }

    setLoading(true)
    setFase('salvar')
    try {
      const res = await fetch('/api/auth/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
        signal: AbortSignal.timeout(12_000),
      })

      let data: Record<string, string> = {}
      try { data = await res.json() } catch { /* corpo não-JSON — ignora */ }

      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar nickname. Tente novamente.')
        return
      }

      // Atualiza o JWT com o novo nickname e redireciona
      setFase('sessao')
      try {
        await update({ nickname })
      } catch {
        // update() falhou — sessão pode ter expirado; pedir novo login
        setErro('Nickname salvo, mas não foi possível atualizar a sessão. Faça login novamente.')
        return
      }
      router.replace('/home')
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
      setFase('salvar')
    }
  }

  const userName = session?.user?.name?.split(' ')[0]

  return (
    <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center px-6">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-5xl">🏆</div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {userName ? `Olá, ${userName}!` : 'Bem-vindo!'}
            </h1>
            <p className="text-white/40 text-sm mt-1">
              Escolha um nickname para aparecer no ranking
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/50 text-xs font-medium block mb-1.5">
              Seu nickname
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium select-none">
                @
              </span>
              <input
                type="text"
                value={nickname}
                onChange={e => {
                  setNickname(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                  setErro('')
                }}
                onBlur={() => {
                  if (nickname.length >= 3 && contemPalavrão(nickname)) {
                    setErro('Este nickname não é permitido. Escolha outro.')
                  }
                }}
                placeholder="joaosilva_sql"
                required
                autoComplete="username"
                maxLength={20}
                autoFocus
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-xl pl-8 pr-4 py-3 text-white placeholder-white/20 text-sm outline-none focus:border-[#8b5cf6] transition-colors"
              />
            </div>
            <p className="text-white/25 text-xs mt-1.5 ml-1">
              Letras, números e _ · 3 a 20 caracteres · não pode ser alterado depois
            </p>
          </div>

          {nickname.length >= 3 && (
            <div className="bg-[#0f1117] border border-[#2a2d3a] rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center text-sm font-bold text-[#a78bfa]">
                {nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">@{nickname}</p>
                <p className="text-white/30 text-xs">Assim você aparecerá no ranking</p>
              </div>
            </div>
          )}

          {erro && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {erro}
            </p>
          )}

          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            disabled={nickname.length < 3}
          >
            {loading && fase === 'sessao' ? 'Atualizando sessão…' : 'Confirmar e entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
