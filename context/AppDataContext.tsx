'use client'
import { createContext, useContext, useCallback, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import {
  idbGetTrilhas,
  idbSetTrilhas,
  idbGetProgresso,
  idbSetProgresso,
  idbGetEtapa,
  idbSetEtapa,
  getOfflineUserKeyHint,
  setOfflineUserKeyHint,
  isOfflineCacheSupported,
} from '@/lib/offline-cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrilhaComProgresso {
  id: string
  slug: string
  titulo: string
  descricao: string
  icone: string
  ordem: number
  totalEtapas: number
  xpTotal: number
  publicada: boolean
  percentualConcluido: number
  etapasConcluidas: number
  ultimaTrilha?: boolean
  desbloqueadaPorAnuncio?: boolean
  etapas?: { id: string; ordem: number; tipo: string; titulo: string; xpReward: number; temAnuncio: boolean }[]
  progressos?: { etapaId: string; trilhaId: string; xpGanho: number; concluidaEm: string }[]
}

export interface ProgressoBasico {
  etapaId: string
  trilhaId: string
  xpGanho: number
  estrelas?: number
  concluidaEm?: string
}

export interface RankUser {
  id: string
  nickname: string | null
  totalXp: number
  xpRanking: number
  streak: number
  prestige: number
}

export interface ConquistaBasica {
  id: string
  emoji: string
  lucideIcon?: string
  nome: string
  desc: string
  desbloqueada: boolean
  alcancadaEm?: string | null
  posicao?: number | null
  tier?: string
  categoria?: string
  secao?: string
}

export interface CertificadoBasico {
  id: string
  hash: string
  emitidoEm: string
  trilha: {
    id: string
    slug: string
    titulo: string
    icone: string
  }
}

// ─── Module-level cache (survives React re-renders/remounts per browser tab) ──

const RANKING_TTL = 3 * 60 * 1000 // 3 min

const _cache = {
  trilhas: {
    data: null as TrilhaComProgresso[] | null,
    loadedAt: 0,
    lang: '',
    userKey: '' as string,
  },
  progresso: { data: null as ProgressoBasico[] | null, loadedAt: 0, userKey: '' as string },
  ranking: { data: null as RankUser[] | null, loadedAt: 0 },
  etapas: {} as Record<string, { data: any; loadedAt: number; contentVersion: string }>,
  conquistas: { data: null as ConquistaBasica[] | null, loadedAt: 0, userKey: '' as string },
  prestige: { data: null as number | null, loadedAt: 0, userKey: '' as string },
  certificados: { data: null as CertificadoBasico[] | null, loadedAt: 0, userKey: '' as string },
}

let _lastContentVersion = '1'
let _contentVersionFetchedAt = 0
const _CONTENT_VERSION_TTL = 30_000

// Inflight promise deduplication — prevents parallel identical fetches
const _inflight: Record<string, Promise<any>> = {}

async function deduped<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = _inflight[key]
  if (existing) return existing
  _inflight[key] = fetcher().finally(() => {
    delete _inflight[key]
  })
  return _inflight[key]
}

async function fetchContentVersion(): Promise<string> {
  if (Date.now() - _contentVersionFetchedAt < _CONTENT_VERSION_TTL) {
    return _lastContentVersion
  }
  try {
    const r = await fetch('/api/conteudo-version')
    if (!r.ok) return _lastContentVersion
    const j = await r.json()
    const v = typeof j.version === 'string' ? j.version : '1'
    _lastContentVersion = v
    _contentVersionFetchedAt = Date.now()
    return v
  } catch {
    return _lastContentVersion
  }
}

function resolveUserKey(
  status: 'loading' | 'authenticated' | 'unauthenticated',
  session: Session | null,
): string {
  const uid = session?.user ? (session.user as { id?: string }).id : undefined
  if (status === 'authenticated' && uid) {
    const id = uid
    setOfflineUserKeyHint(id)
    return id
  }
  if (status === 'unauthenticated') return 'anon'
  return getOfflineUserKeyHint()
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppDataContextType {
  trilhasLoading: boolean
  catalogRevalidating: boolean
  trilhasRevision: number
  loadTrilhas: (lang?: string, force?: boolean) => Promise<TrilhaComProgresso[]>
  invalidateTrilhas: () => void
  marcarTrilhaDesbloqueadaPorAnuncio: (slug: string) => void
  getCachedTrilhas: () => TrilhaComProgresso[] | null

  progressoLoading: boolean
  progressoRevision: number
  loadProgresso: (force?: boolean) => Promise<ProgressoBasico[]>
  addProgressoOptimistic: (etapaId: string, trilhaId: string, xpGanho?: number, estrelas?: number) => void
  invalidateProgresso: () => void
  getCachedProgresso: () => ProgressoBasico[] | null

  rankingLoading: boolean
  loadRanking: (force?: boolean) => Promise<RankUser[]>
  getCachedRanking: () => RankUser[] | null

  loadEtapa: (id: string, lang?: string) => Promise<any | null>
  prefetchEtapa: (id: string, lang?: string) => void
  getCachedEtapa: (id: string, lang?: string) => any | null

  loadConquistas: (force?: boolean) => Promise<ConquistaBasica[]>
  getCachedConquistas: () => ConquistaBasica[] | null
  invalidateConquistas: () => void

  loadPrestige: (force?: boolean) => Promise<number>
  getCachedPrestige: () => number | null

  loadCertificados: (force?: boolean) => Promise<CertificadoBasico[]>
  getCachedCertificados: () => CertificadoBasico[] | null
  invalidateCertificados: () => void
}

const AppDataContext = createContext<AppDataContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const [trilhasLoading, setTrilhasLoading] = useState(false)
  const [progressoLoading, setProgressoLoading] = useState(false)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [catalogRevalidating, setCatalogRevalidating] = useState(false)
  const [trilhasRevision, setTrilhasRevision] = useState(0)
  const [progressoRevision, setProgressoRevision] = useState(0)

  const bumpTrilhas = useCallback(() => {
    setTrilhasRevision(r => r + 1)
  }, [])

  const bumpProgresso = useCallback(() => {
    setProgressoRevision(r => r + 1)
  }, [])

  // ── Trilhas ────────────────────────────────────────────────────────────────

  const loadTrilhas = useCallback(
    async (lang = 'pt', force = false): Promise<TrilhaComProgresso[]> => {
      const userKey = resolveUserKey(status, session)
      const serverVersion = await fetchContentVersion()

      const c = _cache.trilhas
      if (!force && c.data !== null && c.lang === lang && c.userKey === userKey) {
        return c.data
      }

      const revalidateInBackground = () => {
        setCatalogRevalidating(true)
        void deduped(`trilhas-net:${lang}:${userKey}`, async () => {
          try {
            const res = await fetch(`/api/trilhas?lang=${lang}`)
            const data = await res.json()
            const fresh = Array.isArray(data) ? data : []
            _cache.trilhas = { data: fresh, loadedAt: Date.now(), lang, userKey }
            await idbSetTrilhas(lang, userKey, serverVersion, fresh)
            bumpTrilhas()
          } finally {
            setCatalogRevalidating(false)
          }
          return true
        })
      }

      if (!force && isOfflineCacheSupported()) {
        const env = await idbGetTrilhas(lang, userKey, serverVersion)
        if (env && Array.isArray(env.data)) {
          const arr = env.data as TrilhaComProgresso[]
          _cache.trilhas = { data: arr, loadedAt: Date.now(), lang, userKey }
          revalidateInBackground()
          return arr
        }
      }

      setTrilhasLoading(true)
      setCatalogRevalidating(false)
      try {
        const data = await deduped(`trilhas-net:${lang}:${userKey}`, async () => {
          const res = await fetch(`/api/trilhas?lang=${lang}`)
          return res.json()
        })
        const arr = Array.isArray(data) ? data : []
        _cache.trilhas = { data: arr, loadedAt: Date.now(), lang, userKey }
        await idbSetTrilhas(lang, userKey, serverVersion, arr)
        return arr
      } catch {
        return _cache.trilhas.data ?? []
      } finally {
        setTrilhasLoading(false)
      }
    },
    [session, status, bumpTrilhas],
  )

  const invalidateTrilhas = useCallback(() => {
    _cache.trilhas.data = null
    _cache.trilhas.loadedAt = 0
    _cache.trilhas.userKey = ''
    bumpTrilhas()
  }, [bumpTrilhas])

  const getCachedTrilhas = useCallback(() => _cache.trilhas.data, [])

  const marcarTrilhaDesbloqueadaPorAnuncio = useCallback(
    (slug: string) => {
      if (!_cache.trilhas.data) return
      let changed = false
      const next = _cache.trilhas.data.map(t => {
        if (t.slug !== slug) return t
        if (t.desbloqueadaPorAnuncio) return t
        changed = true
        return { ...t, desbloqueadaPorAnuncio: true }
      })
      if (!changed) return
      _cache.trilhas.data = next
      const { lang, userKey } = _cache.trilhas
      if (lang && userKey && userKey !== 'anon') {
        void idbSetTrilhas(lang, userKey, _lastContentVersion, next)
      }
      bumpTrilhas()
    },
    [bumpTrilhas],
  )

  // ── Progresso ──────────────────────────────────────────────────────────────

  const loadProgresso = useCallback(
    async (force = false): Promise<ProgressoBasico[]> => {
      const userKey = resolveUserKey(status, session)
      if (userKey === 'anon') {
        _cache.progresso = { data: [], loadedAt: Date.now(), userKey: 'anon' }
        return []
      }

      const c = _cache.progresso
      if (!force && c.data !== null && c.userKey === userKey) {
        return c.data
      }

      const revalidateProgresso = () => {
        void deduped(`progresso-net:${userKey}`, async () => {
          try {
            const res = await fetch('/api/progresso')
            if (!res.ok) return []
            const data = await res.json()
            const arr = Array.isArray(data) ? data : []
            _cache.progresso = { data: arr, loadedAt: Date.now(), userKey }
            await idbSetProgresso(userKey, arr)
            bumpProgresso()
            return arr
          } catch {
            return []
          }
        })
      }

      if (!force && isOfflineCacheSupported()) {
        const env = await idbGetProgresso(userKey)
        if (env && Array.isArray(env.data)) {
          const arr = env.data as ProgressoBasico[]
          _cache.progresso = { data: arr, loadedAt: Date.now(), userKey }
          revalidateProgresso()
          return arr
        }
      }

      setProgressoLoading(true)
      try {
        const res = await fetch('/api/progresso')
        if (!res.ok) {
          return _cache.progresso.data ?? []
        }
        const data = await res.json()
        const arr = Array.isArray(data) ? data : []
        _cache.progresso = { data: arr, loadedAt: Date.now(), userKey }
        await idbSetProgresso(userKey, arr)
        return arr
      } catch {
        return _cache.progresso.data ?? []
      } finally {
        setProgressoLoading(false)
      }
    },
    [session, status, bumpProgresso],
  )

  const addProgressoOptimistic = useCallback(
    (etapaId: string, trilhaId: string, xpGanho = 0, estrelas = 0) => {
      if (!_cache.progresso.data) return
      const userKey = _cache.progresso.userKey
      const exists = _cache.progresso.data.some(p => p.etapaId === etapaId)
      if (!exists) {
        _cache.progresso.data = [
          ..._cache.progresso.data,
          { etapaId, trilhaId, xpGanho, estrelas, concluidaEm: new Date().toISOString() },
        ]
        if (userKey && userKey !== 'anon') {
          void idbSetProgresso(userKey, _cache.progresso.data)
        }
      }
      if (_cache.trilhas.data) {
        _cache.trilhas.data = _cache.trilhas.data.map(t => {
          if (t.id !== trilhaId) return t
          const progressosTrilha = [...(t.progressos ?? [])]
          if (!progressosTrilha.some(p => p.etapaId === etapaId)) {
            progressosTrilha.push({
              etapaId,
              trilhaId,
              xpGanho,
              concluidaEm: new Date().toISOString(),
            })
          }
          const totalEtapas = t.etapas?.length ?? t.totalEtapas
          const etapasConcluidas = progressosTrilha.length
          const pct =
            totalEtapas > 0 ? Math.min(100, Math.round((etapasConcluidas / totalEtapas) * 100)) : 0
          return {
            ...t,
            progressos: progressosTrilha,
            etapasConcluidas,
            percentualConcluido: pct,
          }
        })
        const { lang, userKey: uk } = _cache.trilhas
        if (lang && uk) {
          void idbSetTrilhas(lang, uk, _lastContentVersion, _cache.trilhas.data)
        }
      }
      bumpProgresso()
      bumpTrilhas()
    },
    [bumpProgresso, bumpTrilhas],
  )

  const invalidateProgresso = useCallback(() => {
    _cache.progresso.data = null
    _cache.progresso.loadedAt = 0
    _cache.progresso.userKey = ''
    bumpProgresso()
  }, [bumpProgresso])

  const getCachedProgresso = useCallback(() => _cache.progresso.data, [])

  // ── Ranking ────────────────────────────────────────────────────────────────

  const loadRanking = useCallback(async (force = false): Promise<RankUser[]> => {
    const c = _cache.ranking
    const isStale = Date.now() - c.loadedAt > RANKING_TTL
    if (!force && c.data !== null && !isStale) return c.data

    setRankingLoading(true)
    try {
      const data = await deduped('ranking', () => fetch('/api/ranking').then(r => r.json()))
      const arr = Array.isArray(data) ? data : []
      _cache.ranking = { data: arr, loadedAt: Date.now() }
      return arr
    } catch {
      return _cache.ranking.data ?? []
    } finally {
      setRankingLoading(false)
    }
  }, [])

  const getCachedRanking = useCallback(() => _cache.ranking.data, [])

  // ── Etapas ─────────────────────────────────────────────────────────────────

  const loadEtapa = useCallback(
    async (id: string, lang = 'pt'): Promise<any | null> => {
      const key = `${id}:${lang}`
      const serverVersion = await fetchContentVersion()
      const mem = _cache.etapas[key]
      if (mem && mem.contentVersion === serverVersion) {
        return mem.data
      }

      if (isOfflineCacheSupported()) {
        const env = await idbGetEtapa(id, lang, serverVersion)
        if (env?.data) {
          _cache.etapas[key] = { data: env.data, loadedAt: Date.now(), contentVersion: serverVersion }
          void deduped(`etapa-net:${key}`, async () => {
            try {
              const res = await fetch(`/api/etapa?id=${id}&lang=${lang}`)
              if (!res.ok) return null
              const data = await res.json()
              _cache.etapas[key] = { data, loadedAt: Date.now(), contentVersion: serverVersion }
              await idbSetEtapa(id, lang, serverVersion, data)
              return data
            } catch {
              return null
            }
          })
          return env.data
        }
      }

      try {
        const data = await deduped(`etapa-net:${key}`, async () => {
          const res = await fetch(`/api/etapa?id=${id}&lang=${lang}`)
          if (!res.ok) throw new Error('not found')
          return res.json()
        })
        _cache.etapas[key] = { data, loadedAt: Date.now(), contentVersion: serverVersion }
        await idbSetEtapa(id, lang, serverVersion, data)
        return data
      } catch {
        return _cache.etapas[key]?.data ?? null
      }
    },
    [],
  )

  const prefetchEtapa = useCallback(
    (id: string, lang = 'pt') => {
      const key = `${id}:${lang}`
      if (_cache.etapas[key]) return
      loadEtapa(id, lang).catch(() => {})
    },
    [loadEtapa],
  )

  const getCachedEtapa = useCallback((id: string, lang = 'pt') => {
    return _cache.etapas[`${id}:${lang}`]?.data ?? null
  }, [])

  // ── Conquistas ─────────────────────────────────────────────────────────────

  const loadConquistas = useCallback(
    async (force = false): Promise<ConquistaBasica[]> => {
      const userKey = resolveUserKey(status, session)
      if (userKey === 'anon') return []

      const c = _cache.conquistas
      if (!force && c.data !== null && c.userKey === userKey) {
        // Revalida em background silenciosamente
        void deduped(`conquistas:${userKey}`, async () => {
          try {
            const res = await fetch('/api/conquistas')
            if (!res.ok) return
            const data = await res.json()
            _cache.conquistas = { data: Array.isArray(data) ? data : [], loadedAt: Date.now(), userKey }
          } catch {}
        })
        return c.data
      }

      try {
        const data = await deduped(`conquistas:${userKey}`, () =>
          fetch('/api/conquistas').then(r => r.json()),
        )
        const arr = Array.isArray(data) ? data : []
        _cache.conquistas = { data: arr, loadedAt: Date.now(), userKey }
        return arr
      } catch {
        return _cache.conquistas.data ?? []
      }
    },
    [session, status],
  )

  const getCachedConquistas = useCallback(() => _cache.conquistas.data, [])

  const invalidateConquistas = useCallback(() => {
    _cache.conquistas.data = null
    _cache.conquistas.loadedAt = 0
    _cache.conquistas.userKey = ''
  }, [])

  // ── Prestige ───────────────────────────────────────────────────────────────

  const loadPrestige = useCallback(
    async (force = false): Promise<number> => {
      const userKey = resolveUserKey(status, session)
      if (userKey === 'anon') return 0

      const c = _cache.prestige
      if (!force && c.data !== null && c.userKey === userKey) {
        void deduped(`prestige:${userKey}`, async () => {
          try {
            const res = await fetch('/api/prestige')
            if (!res.ok) return
            const data = await res.json()
            _cache.prestige = { data: data?.prestige ?? 0, loadedAt: Date.now(), userKey }
          } catch {}
        })
        return c.data
      }

      try {
        const data = await deduped(`prestige:${userKey}`, () =>
          fetch('/api/prestige').then(r => r.json()),
        )
        const val = data?.prestige ?? 0
        _cache.prestige = { data: val, loadedAt: Date.now(), userKey }
        return val
      } catch {
        return _cache.prestige.data ?? 0
      }
    },
    [session, status],
  )

  const getCachedPrestige = useCallback(() => _cache.prestige.data, [])

  // ── Certificados ───────────────────────────────────────────────────────────

  const loadCertificados = useCallback(
    async (force = false): Promise<CertificadoBasico[]> => {
      const userKey = resolveUserKey(status, session)
      if (userKey === 'anon') return []

      const c = _cache.certificados
      if (!force && c.data !== null && c.userKey === userKey) {
        void deduped(`certificados:${userKey}`, async () => {
          try {
            const res = await fetch('/api/certificados')
            if (!res.ok) return
            const data = await res.json()
            _cache.certificados = { data: Array.isArray(data) ? data : [], loadedAt: Date.now(), userKey }
          } catch {}
        })
        return c.data
      }

      try {
        const data = await deduped(`certificados:${userKey}`, () =>
          fetch('/api/certificados').then(r => r.json()),
        )
        const arr = Array.isArray(data) ? data : []
        _cache.certificados = { data: arr, loadedAt: Date.now(), userKey }
        return arr
      } catch {
        return _cache.certificados.data ?? []
      }
    },
    [session, status],
  )

  const getCachedCertificados = useCallback(() => _cache.certificados.data, [])

  const invalidateCertificados = useCallback(() => {
    _cache.certificados.data = null
    _cache.certificados.loadedAt = 0
    _cache.certificados.userKey = ''
  }, [])

  return (
    <AppDataContext.Provider
      value={{
        trilhasLoading,
        catalogRevalidating,
        trilhasRevision,
        loadTrilhas,
        invalidateTrilhas,
        marcarTrilhaDesbloqueadaPorAnuncio,
        getCachedTrilhas,
        progressoLoading,
        progressoRevision,
        loadProgresso,
        addProgressoOptimistic,
        invalidateProgresso,
        getCachedProgresso,
        rankingLoading,
        loadRanking,
        getCachedRanking,
        loadEtapa,
        prefetchEtapa,
        getCachedEtapa,
        loadConquistas,
        getCachedConquistas,
        invalidateConquistas,
        loadPrestige,
        getCachedPrestige,
        loadCertificados,
        getCachedCertificados,
        invalidateCertificados,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider')
  return ctx
}
