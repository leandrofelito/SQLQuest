'use client'
import { useEffect, useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { XpBar } from '@/components/ui/XpBar'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'

interface Conquista {
  id: string
  emoji: string
  nome: string
  desc: string
  desbloqueada: boolean
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export default function PerfilPage() {
  const { user, isPro } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState({ etapas: 0, certificados: 0 })
  const [conquistas, setConquistas] = useState<Conquista[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setActiveTooltip(null)
      }
    }
    if (activeTooltip) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeTooltip])

  const xp = (user as any)?.totalXp ?? 0
  const streak = (user as any)?.streak ?? 0

  useEffect(() => {
    async function load() {
      const [progressoRes, certsRes, conquistasRes] = await Promise.all([
        fetch('/api/progresso'),
        fetch('/api/certificados'),
        fetch('/api/conquistas'),
      ])
      const progressos = await progressoRes.json()
      const certs = await certsRes.json()
      const conquistasData = await conquistasRes.json()
      setStats({
        etapas: Array.isArray(progressos) ? progressos.length : 0,
        certificados: Array.isArray(certs) ? certs.length : 0,
      })
      setConquistas(Array.isArray(conquistasData) ? conquistasData : [])
    }
    load()
  }, [])

  async function handleSignOut() {
    setLoading(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-[#080a0f] pb-24">
      <Header title="Perfil" />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Avatar e info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#8b5cf6]/20 border-2 border-[#8b5cf6]/40 flex items-center justify-center text-2xl font-bold text-[#a78bfa]">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{user?.name}</p>
            <p className="text-white/40 text-sm">{user?.email}</p>
            {isPro && (
              <span className="inline-flex items-center gap-1 bg-[#8b5cf6]/15 text-[#a78bfa] text-xs font-bold px-2 py-0.5 rounded-full border border-[#8b5cf6]/25 mt-1">
                ⭐ PRO
              </span>
            )}
          </div>
        </div>

        {/* XP Bar */}
        <XpBar xp={xp} showStats />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Streak', value: streak, unit: 'dias', emoji: '🔥' },
            { label: 'Etapas', value: stats.etapas, unit: 'concluídas', emoji: '⚡' },
            { label: 'Certs', value: stats.certificados, unit: 'emitidos', emoji: '🏅' },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1117] border border-[#1e2028] rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-white/30 text-[10px]">{s.unit}</div>
            </div>
          ))}
        </div>

        {/* Conquistas */}
        <div>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">
            Conquistas — {conquistas.filter(c => c.desbloqueada).length}/{conquistas.length}
          </h3>
          <div className="grid grid-cols-3 gap-2" ref={tooltipRef}>
            {conquistas.map((c, i) => {
              const isOpen = activeTooltip === c.id
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative bg-[#0f1117] border rounded-2xl p-3 text-center transition-all group ${
                    c.desbloqueada
                      ? 'border-[#8b5cf6]/40 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'border-[#1e2028] opacity-35 grayscale'
                  }`}
                >
                  {/* Ícone de info */}
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setActiveTooltip(isOpen ? null : c.id)
                    }}
                    className="absolute top-2 right-2 text-white/30 hover:text-white/80 transition-opacity duration-200 group-hover:opacity-100 focus:outline-none"
                    aria-label={`Como desbloquear: ${c.nome}`}
                  >
                    <InfoIcon />
                  </button>

                  {/* Tooltip */}
                  {isOpen && (
                    <div className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-44 bg-[#1a1d27] border border-[#8b5cf6]/30 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none">
                      <p className="text-[#a78bfa] text-[10px] font-semibold mb-0.5">Como desbloquear</p>
                      <p className="text-white/70 text-[10px] leading-snug">{c.desc}</p>
                      {/* Setinha */}
                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d27] border-r border-b border-[#8b5cf6]/30 rotate-45" />
                    </div>
                  )}

                  {/* Tooltip CSS puro no hover (desktop) */}
                  <div className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-44 bg-[#1a1d27] border border-[#8b5cf6]/30 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                    <p className="text-[#a78bfa] text-[10px] font-semibold mb-0.5">Como desbloquear</p>
                    <p className="text-white/70 text-[10px] leading-snug">{c.desc}</p>
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d27] border-r border-b border-[#8b5cf6]/30 rotate-45" />
                  </div>

                  <div className="text-2xl mb-1">{c.emoji}</div>
                  <p className="text-white text-[10px] font-semibold leading-tight">{c.nome}</p>
                  {c.desbloqueada && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] mx-auto mt-1.5" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Upgrade se free */}
        {!isPro && (
          <Button onClick={() => router.push('/upgrade')} fullWidth>
            ⭐ Assinar Pro — R$29,99
          </Button>
        )}

        {/* Sair */}
        <Button
          onClick={handleSignOut}
          loading={loading}
          variant="secondary"
          fullWidth
        >
          Sair
        </Button>
      </div>

      <NavBottom />
    </div>
  )
}
