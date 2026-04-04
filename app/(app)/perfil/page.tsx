'use client'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/Header'
import { NavBottom } from '@/components/layout/NavBottom'
import { XpBar } from '@/components/ui/XpBar'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/hooks/useUser'

const CONQUISTAS = [
  { id: 'primeira_etapa', emoji: '⚡', nome: 'Primeira Etapa', desc: 'Completou a primeira etapa' },
  { id: 'trilha_1', emoji: '🔍', nome: 'Explorador SQL', desc: 'Completou SELECT Básico' },
  { id: 'sem_dicas', emoji: '🧠', nome: 'Sem Ajuda', desc: 'Resolveu sem usar dicas' },
  { id: 'streak_7', emoji: '🔥', nome: 'Semana Firme', desc: '7 dias consecutivos' },
  { id: 'pro', emoji: '⭐', nome: 'Membro Pro', desc: 'Assinou o plano Pro' },
  { id: 'cert_1', emoji: '🏅', nome: 'Certificado', desc: 'Conquistou primeiro certificado' },
]

export default function PerfilPage() {
  const { user, isPro } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState({ etapas: 0, certificados: 0, trilhasPct: 0 })
  const [loading, setLoading] = useState(false)

  const xp = (user as any)?.totalXp ?? 0
  const streak = (user as any)?.streak ?? 0

  useEffect(() => {
    async function load() {
      const [progressoRes, certsRes] = await Promise.all([
        fetch('/api/progresso'),
        fetch('/api/certificados'),
      ])
      const progressos = await progressoRes.json()
      const certs = await certsRes.json()
      setStats({
        etapas: Array.isArray(progressos) ? progressos.length : 0,
        certificados: Array.isArray(certs) ? certs.length : 0,
        trilhasPct: 0,
      })
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

      <div className="px-4 pt-6 space-y-6">
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
            { label: 'Certs', value: stats.certificados, unit: 'ganhos', emoji: '🏅' },
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
          <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-3">Conquistas</h3>
          <div className="grid grid-cols-3 gap-2">
            {CONQUISTAS.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#0f1117] border border-[#1e2028] rounded-2xl p-3 text-center opacity-40"
                title={c.desc}
              >
                <div className="text-2xl mb-1">{c.emoji}</div>
                <p className="text-white text-[10px] font-semibold leading-tight">{c.nome}</p>
              </motion.div>
            ))}
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
