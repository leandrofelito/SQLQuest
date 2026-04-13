'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Cpu, type LucideIcon } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { XpBar } from '@/components/ui/XpBar'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'
import { getLevel, getLevelBadge } from '@/lib/xp'
import { PrestigeBadge, getPrestigeTier } from '@/components/ui/PrestigeBadge'
import { useAppData } from '@/context/AppDataContext'
import { useLocale } from '@/context/LocaleContext'
import { type Locale } from '@/lib/locale'

function ConquistasSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-[#0f1117] border border-[#1e2028] rounded-2xl p-3 text-center animate-pulse">
          <div className="w-8 h-8 bg-white/10 rounded-full mx-auto mb-2" />
          <div className="h-2.5 bg-white/10 rounded w-12 mx-auto" />
        </div>
      ))}
    </div>
  )
}

const LUCIDE_ICONS: Record<string, LucideIcon> = {
  Cpu,
}

interface Conquista {
  id: string
  emoji: string
  lucideIcon?: string
  nome: string
  desc: string
  desbloqueada: boolean
  alcancadaEm?: string | null
  posicao?: number | null
  tier?: string
}

function ConquistaIcon({ conquista, desbloqueada }: { conquista: Conquista; desbloqueada: boolean }) {
  const Icon = conquista.lucideIcon ? LUCIDE_ICONS[conquista.lucideIcon] : null
  if (Icon) {
    return (
      <Icon
        size={28}
        strokeWidth={1.5}
        className={desbloqueada ? 'text-[#a78bfa]' : 'text-white/20'}
      />
    )
  }
  return <span className="text-3xl">{conquista.emoji}</span>
}

const RANKING_CORES: Record<string, { borda: string; brilho: string; texto: string; bg: string; label: string }> = {
  top1:    { borda: '#FFD700', brilho: 'rgba(255,215,0,0.25)',   texto: '#FFD700', bg: 'rgba(255,215,0,0.08)',   label: 'Top 1' },
  top10:   { borda: '#C0C0C0', brilho: 'rgba(192,192,192,0.2)',  texto: '#C0C0C0', bg: 'rgba(192,192,192,0.07)', label: 'Top 10' },
  top100:  { borda: '#CD7F32', brilho: 'rgba(205,127,50,0.2)',   texto: '#CD7F32', bg: 'rgba(205,127,50,0.07)',  label: 'Top 100' },
  top1000: { borda: '#4A90E2', brilho: 'rgba(74,144,226,0.2)',   texto: '#4A90E2', bg: 'rgba(74,144,226,0.07)',  label: 'Top 1000' },
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

const LANG_OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: 'pt', flag: '🇧🇷', label: 'Português' },
  { value: 'en', flag: '🇺🇸', label: 'English' },
  { value: 'es', flag: '🇪🇸', label: 'Español' },
]

export default function PerfilPage() {
  const { user, isPro } = useUser()
  const router = useRouter()
  const { loadProgresso, progressoRevision } = useAppData()
  const { locale, setLocale, messages } = useLocale()
  const m = messages.perfil
  const [stats, setStats] = useState({ etapas: 0, certificados: 0 })
  const [conquistas, setConquistas] = useState<Conquista[]>([])
  const [conquistasLoading, setConquistasLoading] = useState(true)
  const [prestige, setPrestige] = useState(0)
  const [loading, setLoading] = useState(false)
  const [prestigeLoading, setPrestigeLoading] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [filtroConquistas, setFiltroConquistas] = useState<'desbloqueadas' | 'todas' | 'bloqueadas'>('desbloqueadas')
  const tooltipRef = useRef<HTMLDivElement>(null)

  const { conquistasGerais, conquistasFiltradas } = useMemo(() => {
    const gerais = conquistas.filter(c => !c.tier)
    if (filtroConquistas === 'desbloqueadas') {
      return { conquistasGerais: gerais, conquistasFiltradas: gerais.filter(c => c.desbloqueada) }
    }
    if (filtroConquistas === 'bloqueadas') {
      return { conquistasGerais: gerais, conquistasFiltradas: gerais.filter(c => !c.desbloqueada) }
    }
    return { conquistasGerais: gerais, conquistasFiltradas: gerais }
  }, [conquistas, filtroConquistas])

  useEffect(() => {
    setActiveTooltip(null)
  }, [filtroConquistas])

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
  const nivel = getLevel(xp)
  const badge = getLevelBadge(nivel)

  useEffect(() => {
    async function load() {
      const [progressos, certsRes, conquistasRes, prestigeRes] = await Promise.all([
        loadProgresso(),
        fetch('/api/certificados').then(r => r.json()),
        fetch('/api/conquistas').then(r => r.json()),
        fetch('/api/prestige').then(r => r.json()),
      ])
      setStats({
        etapas: Array.isArray(progressos) ? progressos.length : 0,
        certificados: Array.isArray(certsRes) ? certsRes.length : 0,
      })
      setConquistas(Array.isArray(conquistasRes) ? conquistasRes : [])
      setPrestige(prestigeRes?.prestige ?? 0)
      setConquistasLoading(false)
    }
    load()
  }, [loadProgresso, progressoRevision])

  async function handleSignOut() {
    setLoading(true)
    localStorage.setItem('sqlquest_force_logout', '1')
    localStorage.removeItem('sqlquest_keep_logged_in')
    sessionStorage.removeItem('sqlquest_session_active')
    if (typeof window !== 'undefined' && (window as any).__sqlquestNativeApp) {
      (window as any).SessionBridge?.postMessage('logout')
    }
    await signOut({ callbackUrl: '/login' })
  }

  async function handlePrestige() {
    const { tierIndex, starsInTier } = getPrestigeTier(prestige + 1)
    const TIER_NAMES = [m.tierBronze, m.tierPrata, m.tierOuro, m.tierRubi]
    const tierName = TIER_NAMES[tierIndex]
    const starStr = '★'.repeat(starsInTier)
    const confirmMsg = m.confirmarPrestigio
      .replace('{n}', String(prestige + 1))
      .replace('{tier}', tierName)
      .replace('{stars}', starStr)
    if (!confirm(confirmMsg)) return
    setPrestigeLoading(true)
    const res = await fetch('/api/prestige', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setPrestige(data.prestige)
      router.refresh()
    }
    setPrestigeLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#080a0f] pb-[calc(5rem+var(--safe-area-bottom,0px))]">
      <Header title={m.titulo} />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Avatar e info */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold relative"
            style={{
              background: badge.bg,
              border: `2px solid ${badge.cor}`,
              boxShadow: `0 0 18px ${badge.brilho}`,
              color: badge.cor,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-lg">{user?.name}</p>
              <PrestigeBadge prestige={prestige} size="md" />
            </div>
            {(user as any)?.nickname && (
              <p className="text-[#a78bfa] text-sm font-medium">@{(user as any).nickname}</p>
            )}
            <p className="text-white/40 text-sm">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border"
                style={{ background: badge.bg, borderColor: badge.cor, color: badge.cor }}
              >
                {badge.emoji} {badge.nome} · Nv.{nivel}
              </span>
              {isPro && (
                <span className="inline-flex items-center gap-1 bg-[#8b5cf6]/15 text-[#a78bfa] text-xs font-bold px-2 py-0.5 rounded-full border border-[#8b5cf6]/25">
                  ⭐ PRO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <XpBar xp={xp} showStats />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: m.streak, value: streak, unit: m.dias, emoji: '🔥' },
            { label: m.etapas, value: stats.etapas, unit: m.concluidas, emoji: '⚡' },
            { label: m.certs, value: stats.certificados, unit: m.emitidos, emoji: '🏅' },
          ].map(s => (
            <div key={s.label} className="bg-[#0f1117] border border-[#1e2028] rounded-2xl p-3 text-center">
              <div className="text-xl mb-1">{s.emoji}</div>
              <div className="text-white font-bold text-lg">{s.value}</div>
              <div className="text-white/30 text-[10px]">{s.unit}</div>
            </div>
          ))}
        </div>

        {/* Badges de Ranking Global */}
        {(() => {
          const rankingConquistas = conquistas.filter(c => c.tier)
          if (rankingConquistas.length === 0) return null
          return (
            <div>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">
                {m.rankingGlobal}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {rankingConquistas.map((c) => {
                  const cor = RANKING_CORES[c.tier!]
                  const rankingInfoOpen = activeTooltip === c.id
                  return (
                    <div
                      key={c.id}
                      className="relative group rounded-2xl p-4 flex items-center gap-3 transition-all"
                      style={{
                        background: c.desbloqueada ? cor.bg : 'rgba(15,17,23,1)',
                        border: `1px solid ${c.desbloqueada ? cor.borda : '#1e2028'}`,
                        boxShadow: c.desbloqueada ? `0 0 18px ${cor.brilho}` : 'none',
                        opacity: c.desbloqueada ? 1 : 0.35,
                        filter: c.desbloqueada ? 'none' : 'grayscale(1)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setActiveTooltip(rankingInfoOpen ? null : c.id)
                        }}
                        className="absolute top-2 right-2 z-10 text-white/30 hover:text-white/80 transition-opacity duration-200 group-hover:opacity-100 focus:outline-none"
                        aria-label={`${m.comoDesbloquear}: ${c.nome}`}
                      >
                        <InfoIcon />
                      </button>

                      {rankingInfoOpen && (
                        <div className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-52 max-w-[min(100vw-2rem,13rem)] bg-[#1a1d27] border border-[#8b5cf6]/30 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none">
                          <p className="text-[#a78bfa] text-[10px] font-semibold mb-0.5">{m.comoDesbloquear}</p>
                          <p className="text-white/70 text-[10px] leading-snug">{c.desc}</p>
                          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d27] border-r border-b border-[#8b5cf6]/30 rotate-45" />
                        </div>
                      )}

                      <div className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-52 max-w-[min(100vw-2rem,13rem)] bg-[#1a1d27] border border-[#8b5cf6]/30 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                        <p className="text-[#a78bfa] text-[10px] font-semibold mb-0.5">{m.comoDesbloquear}</p>
                        <p className="text-white/70 text-[10px] leading-snug">{c.desc}</p>
                        <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d27] border-r border-b border-[#8b5cf6]/30 rotate-45" />
                      </div>

                      <ConquistaIcon conquista={c} desbloqueada={c.desbloqueada} />
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-white text-sm font-bold leading-tight">{c.nome}</p>
                        <p className="text-xs mt-0.5" style={{ color: c.desbloqueada ? cor.texto : '#ffffff40' }}>
                          {c.desbloqueada
                            ? `#${c.posicao} · ${new Date(c.alcancadaEm!).toLocaleDateString('pt-BR')}`
                            : cor.label + ' ' + m.mundoDo}
                        </p>
                      </div>
                      {c.desbloqueada && (
                        <div
                          className="absolute top-2 right-7 w-2 h-2 rounded-full animate-pulse"
                          style={{ background: cor.borda }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Conquistas */}
        <div>
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">
            {conquistasLoading
              ? m.conquistas
              : `${m.conquistas} — ${conquistasGerais.filter(c => c.desbloqueada).length}/${conquistasGerais.length}`}
          </h3>
          {conquistasLoading ? <ConquistasSkeleton /> : null}
          {!conquistasLoading && conquistasGerais.length > 0 ? (
            <div
              className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1"
              role="tablist"
              aria-label={m.conquistas}
            >
              {(
                [
                  ['desbloqueadas', m.conquistasFiltroDesbloqueadas] as const,
                  ['todas', m.conquistasFiltroTodas] as const,
                  ['bloqueadas', m.conquistasFiltroBloqueadas] as const,
                ] as const
              ).map(([key, label]) => {
                const ativo = filtroConquistas === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={ativo}
                    onClick={() => setFiltroConquistas(key)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border ${
                      ativo
                        ? 'bg-[#8b5cf6]/25 border-[#8b5cf6]/50 text-white'
                        : 'bg-[#0f1117] border-[#1e2028] text-white/50 hover:text-white/70'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ) : null}
          <div className={`grid grid-cols-3 gap-2 ${conquistasLoading ? 'hidden' : ''}`} ref={tooltipRef}>
            {!conquistasLoading && conquistasFiltradas.length === 0 ? (
              <div className="col-span-3 rounded-2xl border border-[#1e2028] bg-[#0f1117]/80 px-4 py-6 text-center">
                <p className="text-white/45 text-sm leading-relaxed">
                  {filtroConquistas === 'desbloqueadas' ? m.conquistasVazioDesbloqueadas : m.conquistasVazioBloqueadas}
                </p>
              </div>
            ) : null}
            {conquistasFiltradas.map((c, i) => {
              const isOpen = activeTooltip === c.id
              return (
                <motion.div
                  key={`${filtroConquistas}-${c.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.05, 0.6) }}
                  className={`relative bg-[#0f1117] border rounded-2xl p-3 text-center transition-all group ${
                    c.desbloqueada
                      ? 'border-[#8b5cf6]/40 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                      : 'border-[#1e2028] opacity-35 grayscale'
                  }`}
                >
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setActiveTooltip(isOpen ? null : c.id)
                    }}
                    className="absolute top-2 right-2 text-white/30 hover:text-white/80 transition-opacity duration-200 group-hover:opacity-100 focus:outline-none"
                    aria-label={`${m.comoDesbloquear}: ${c.nome}`}
                  >
                    <InfoIcon />
                  </button>

                  {isOpen && (
                    <div className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-44 bg-[#1a1d27] border border-[#8b5cf6]/30 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none">
                      <p className="text-[#a78bfa] text-[10px] font-semibold mb-0.5">{m.comoDesbloquear}</p>
                      <p className="text-white/70 text-[10px] leading-snug">{c.desc}</p>
                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d27] border-r border-b border-[#8b5cf6]/30 rotate-45" />
                    </div>
                  )}

                  <div className="absolute z-50 bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 w-44 bg-[#1a1d27] border border-[#8b5cf6]/30 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:block">
                    <p className="text-[#a78bfa] text-[10px] font-semibold mb-0.5">{m.comoDesbloquear}</p>
                    <p className="text-white/70 text-[10px] leading-snug">{c.desc}</p>
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1a1d27] border-r border-b border-[#8b5cf6]/30 rotate-45" />
                  </div>

                  <div className="flex items-center justify-center mb-1 h-8"><ConquistaIcon conquista={c} desbloqueada={c.desbloqueada} /></div>
                  <p className="text-white text-[10px] font-semibold leading-tight">{c.nome}</p>
                  {c.desbloqueada && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] mx-auto mt-1.5" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Botão de Prestígio */}
        {nivel >= 100 && (() => {
          const next = getPrestigeTier(prestige + 1)
          const TIER_NAMES = [m.tierBronze, m.tierPrata, m.tierOuro, m.tierRubi]
          const TIER_COLORS = ['#cd7f32', '#c0c0c0', '#facc15', '#ef4444']
          const nextTierName = TIER_NAMES[next.tierIndex]
          const nextColor = TIER_COLORS[next.tierIndex]
          return (
            <div
              className="rounded-2xl border p-4 text-center"
              style={{ borderColor: nextColor, background: `${nextColor}10` }}
            >
              <p className="font-bold text-sm mb-1" style={{ color: nextColor }}>👑 {m.prestigeDisponivel}</p>
              <p className="text-white/50 text-xs mb-1">
                {m.prestigeDesc
                  .replace('{nivel}', String(nivel))
                  .replace('{prestige}', String(prestige + 1))}
              </p>
              <p className="text-xs mb-3" style={{ color: nextColor, opacity: 0.85 }}>
                {m.prestigeStars
                  .replace('{stars}', '★'.repeat(next.starsInTier))
                  .replace('{tier}', nextTierName)
                  .replace('{current}', String(next.starsInTier))}
              </p>
              <Button
                onClick={handlePrestige}
                loading={prestigeLoading}
                fullWidth
              >
                {m.ativarPrestigio.replace('{n}', String(prestige + 1))}
              </Button>
            </div>
          )
        })()}

        {/* Upgrade se free */}
        {!isPro && (
          <Button onClick={() => router.push('/upgrade')} fullWidth>
            {m.assinarPro}
          </Button>
        )}

        {/* Preferências */}
        <div className="bg-[#0f1117] border border-[#1e2028] rounded-2xl p-4 space-y-3">
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide">{m.preferencias}</h3>
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">{m.idioma}</span>
            <div className="flex items-center gap-1 bg-[#080a0f] border border-[#1e2028] rounded-xl p-1">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setLocale(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    locale === opt.value
                      ? 'bg-[#8b5cf6] text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suporte */}
        <p className="text-center text-white/25 text-xs">
          {m.ajuda}{' '}
          <a
            href="mailto:suporte@sqlquest.com.br"
            className="text-[#a78bfa] hover:underline"
          >
            suporte@sqlquest.com.br
          </a>
        </p>

        {/* Sair */}
        <Button
          onClick={handleSignOut}
          loading={loading}
          variant="secondary"
          fullWidth
        >
          {m.sair}
        </Button>
      </div>

      <NavBottom />
    </div>
  )
}
