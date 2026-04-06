'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { getLevelLabel } from '@/lib/xp'
import { formatXP } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

interface RankUser {
  id: string
  name: string | null
  image: string | null
  totalXp: number
  streak: number
}

const PODIO_CORES = ['#f59e0b', '#9ca3af', '#b45309']
const PODIO_EMOJIS = ['🥇', '🥈', '🥉']

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
              return (
                <motion.div
                  key={u.id}
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: realIdx * 0.1 }}
                >
                  <span className="text-2xl">{PODIO_EMOJIS[realIdx]}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base" style={{ backgroundColor: cor + '30', color: cor, border: `2px solid ${cor}` }}>
                    {u.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <p className="text-white text-xs font-semibold truncate max-w-[70px] text-center">{u.name?.split(' ')[0]}</p>
                  <p className="text-xs font-bold" style={{ color: cor }}>{formatXP(u.totalXp)} XP</p>
                  <div className="rounded-t-xl flex items-end justify-center" style={{ height: altura, width: 60, backgroundColor: cor + '15', border: `1px solid ${cor}40` }}>
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
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 p-3 rounded-2xl ${isMe ? 'bg-[#8b5cf6]/15 border border-[#8b5cf6]/30' : 'bg-[#0f1117] border border-[#1e2028]'}`}
                >
                  <span className="w-7 text-center font-bold text-sm" style={{ color: i < 3 ? PODIO_CORES[i] : '#ffffff40' }}>
                    {i < 3 ? PODIO_EMOJIS[i] : `#${i + 1}`}
                  </span>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isMe ? 'bg-[#8b5cf6]/30 text-[#a78bfa]' : 'bg-[#1e2028] text-white/60'}`}>
                    {u.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${isMe ? 'text-white' : 'text-white/80'}`}>
                      {u.name ?? 'Anônimo'} {isMe && <span className="text-[#a78bfa] text-xs">(você)</span>}
                    </p>
                    <p className="text-white/30 text-xs">{getLevelLabel(u.totalXp)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isMe ? 'text-[#a78bfa]' : 'text-white/70'}`}>{formatXP(u.totalXp)}</p>
                    <p className="text-xs text-white/30">XP</p>
                  </div>
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
