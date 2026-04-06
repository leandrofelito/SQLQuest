'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { PrestigeBadge } from '@/components/ui/PrestigeBadge'
import { getLevelLabel } from '@/lib/xp'
import { formatXP } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

interface RankUser {
  id: string
  name: string | null
  image: string | null
  totalXp: number
  streak: number
  prestige: number
}

const PODIO_CORES = ['#f59e0b', '#9ca3af', '#b45309']
const PODIO_EMOJIS = ['🥇', '🥈', '🥉']

// Efeitos elite para top-3 — glow pulsante suave + nome em gradiente
const ELITE = [
  {
    border: 'rgba(255,215,0,0.35)',
    bg: 'rgba(255,215,0,0.05)',
    glow: ['0 0 10px rgba(255,215,0,0.12)', '0 0 22px rgba(255,215,0,0.28)', '0 0 10px rgba(255,215,0,0.12)'] as string[],
    nameGradient: 'linear-gradient(90deg, #FFD700 0%, #FFAA00 100%)',
  },
  {
    border: 'rgba(200,200,210,0.3)',
    bg: 'rgba(200,200,210,0.04)',
    glow: ['0 0 8px rgba(200,200,210,0.10)', '0 0 18px rgba(200,200,210,0.22)', '0 0 8px rgba(200,200,210,0.10)'] as string[],
    nameGradient: 'linear-gradient(90deg, #E0E0E8 0%, #A8A8B8 100%)',
  },
  {
    border: 'rgba(205,127,50,0.3)',
    bg: 'rgba(205,127,50,0.04)',
    glow: ['0 0 8px rgba(205,127,50,0.10)', '0 0 18px rgba(205,127,50,0.22)', '0 0 8px rgba(205,127,50,0.10)'] as string[],
    nameGradient: 'linear-gradient(90deg, #CD7F32 0%, #A0522D 100%)',
  },
]

function EliteName({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <p
      className="font-bold text-sm truncate"
      style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </p>
  )
}

export default function RankingPage() {
  const { user } = useUser()
  const [ranking, setRanking] = useState<RankUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ranking')
      .then(r => r.json())
      .then(setRanking)
      .finally(() => setLoading(false))
  }, [])

  const podio = ranking.slice(0, 3)
  const resto = ranking.slice(3)

  return (
    <div className="min-h-screen bg-[#080a0f] pb-24">
      <Header title="Ranking Global" />

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {/* Pódio */}
        {podio.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-8 pt-4">
            {[podio[1], podio[0], podio[2]].map((u, i) => {
              const realIdx = i === 0 ? 1 : i === 1 ? 0 : 2
              const altura = realIdx === 0 ? 90 : 70
              const cor = PODIO_CORES[realIdx]
              const elite = ELITE[realIdx]
              return (
                <motion.div
                  key={u.id}
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: realIdx * 0.1 }}
                >
                  <span className="text-2xl">{PODIO_EMOJIS[realIdx]}</span>

                  {/* Avatar com glow pulsante */}
                  <motion.div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base"
                    style={{ backgroundColor: cor + '30', color: cor, border: `2px solid ${cor}` }}
                    animate={{ boxShadow: elite.glow }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {u.name?.charAt(0).toUpperCase() ?? '?'}
                  </motion.div>

                  <div className="flex flex-col items-center gap-0.5">
                    <p
                      className="text-xs font-bold truncate max-w-[70px] text-center"
                      style={{
                        background: elite.nameGradient,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {u.name?.split(' ')[0]}
                    </p>
                    {u.prestige > 0 && <PrestigeBadge prestige={u.prestige} size="sm" />}
                  </div>

                  <p className="text-xs font-bold" style={{ color: cor }}>{formatXP(u.totalXp)} XP</p>
                  <div
                    className="rounded-t-xl flex items-end justify-center"
                    style={{ height: altura, width: 60, backgroundColor: cor + '15', border: `1px solid ${cor}40` }}
                  >
                    <span className="text-white font-bold text-lg pb-2">{realIdx + 1}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-white/30 animate-pulse">Carregando ranking...</div>
        ) : (
          <div className="space-y-2">
            {[...podio, ...resto].map((u, i) => {
              const isMe = u.id === (user as any)?.id
              const isElite = i < 3
              const elite = isElite ? ELITE[i] : null

              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-2xl border"
                    style={
                      isMe
                        ? { background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.3)' }
                        : isElite
                          ? { background: elite!.bg, borderColor: elite!.border }
                          : { background: '#0f1117', borderColor: '#1e2028' }
                    }
                    animate={isElite && !isMe ? { boxShadow: elite!.glow } : undefined}
                    transition={isElite && !isMe ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
                  >
                    {/* Posição */}
                    <span
                      className="w-7 text-center font-bold text-sm flex-shrink-0"
                      style={{ color: i < 3 ? PODIO_CORES[i] : '#ffffff40' }}
                    >
                      {i < 3 ? PODIO_EMOJIS[i] : `#${i + 1}`}
                    </span>

                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isMe ? 'bg-[#8b5cf6]/30 text-[#a78bfa]' : 'bg-[#1e2028] text-white/60'
                      }`}
                    >
                      {u.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>

                    {/* Nome + prestígio */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isElite && !isMe ? (
                          <EliteName gradient={elite!.nameGradient}>
                            {u.name ?? 'Anônimo'}
                          </EliteName>
                        ) : (
                          <p className={`font-semibold text-sm truncate ${isMe ? 'text-white' : 'text-white/80'}`}>
                            {u.name ?? 'Anônimo'}
                          </p>
                        )}
                        {isMe && <span className="text-[#a78bfa] text-xs">(você)</span>}
                        {u.prestige > 0 && <PrestigeBadge prestige={u.prestige} size="sm" />}
                      </div>
                      <p className="text-white/30 text-xs">{getLevelLabel(u.totalXp)}</p>
                    </div>

                    {/* XP */}
                    <div className="text-right flex-shrink-0">
                      {isElite && !isMe ? (
                        <p
                          className="font-bold text-sm"
                          style={{
                            background: elite!.nameGradient,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {formatXP(u.totalXp)}
                        </p>
                      ) : (
                        <p className={`font-bold text-sm ${isMe ? 'text-[#a78bfa]' : 'text-white/70'}`}>
                          {formatXP(u.totalXp)}
                        </p>
                      )}
                      <p className="text-xs text-white/30">XP</p>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <NavBottom />
    </div>
  )
}
