'use client'
import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react'

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
  name: string | null
  nickname: string | null
  image: string | null
  totalXp: number
  streak: number
  prestige: number
}

// ─── Module-level cache (survives React re-renders/remounts per browser tab) ──

const RANKING_TTL = 3 * 60 * 1000 // 3 min

const _cache = {
  trilhas: { data: null as TrilhaComProgresso[] | null, loadedAt: 0, lang: '' },
  progresso: { data: null as ProgressoBasico[] | null, loadedAt: 0 },
  ranking: { data: null as RankUser[] | null, loadedAt: 0 },
  // keyed by `${id}:${lang}`
  etapas: {} as Record<string, { data: any; loadedAt: number }>,
}

// Inflight promise deduplication — prevents parallel identical fetches
const _inflight: Record<string, Promise<any>> = {}

async function deduped<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = _inflight[key]
  if (existing) return existing
  _inflight[key] = fetcher().finally(() => { delete _inflight[key] })
  return _inflight[key]
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppDataContextType {
  // Trilhas
  trilhasLoading: boolean
  loadTrilhas: (lang?: string, force?: boolean) => Promise<TrilhaComProgresso[]>
  invalidateTrilhas: () => void
  getCachedTrilhas: () => TrilhaComProgresso[] | null

  // Progresso
  progressoLoading: boolean
  loadProgresso: (force?: boolean) => Promise<ProgressoBasico[]>
  addProgressoOptimistic: (etapaId: string, trilhaId: string, xpGanho?: number, estrelas?: number) => void
  invalidateProgresso: () => void
  getCachedProgresso: () => ProgressoBasico[] | null

  // Ranking
  rankingLoading: boolean
  loadRanking: (force?: boolean) => Promise<RankUser[]>
  getCachedRanking: () => RankUser[] | null

  // Etapas
  loadEtapa: (id: string, lang?: string) => Promise<any | null>
  prefetchEtapa: (id: string, lang?: string) => void
  getCachedEtapa: (id: string, lang?: string) => any | null
}

const AppDataContext = createContext<AppDataContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: ReactNode }) {
  // Loading states just to trigger re-renders when needed
  const [trilhasLoading, setTrilhasLoading] = useState(false)
  const [progressoLoading, setProgressoLoading] = useState(false)
  const [rankingLoading, setRankingLoading] = useState(false)

  // ── Trilhas ────────────────────────────────────────────────────────────────

  const loadTrilhas = useCallback(async (lang = 'pt', force = false): Promise<TrilhaComProgresso[]> => {
    const c = _cache.trilhas
    if (!force && c.data !== null && c.lang === lang) return c.data

    setTrilhasLoading(true)
    try {
      const data = await deduped(`trilhas:${lang}`, () =>
        fetch(`/api/trilhas?lang=${lang}`).then(r => r.json())
      )
      const arr = Array.isArray(data) ? data : []
      _cache.trilhas = { data: arr, loadedAt: Date.now(), lang }
      return arr
    } catch {
      return _cache.trilhas.data ?? []
    } finally {
      setTrilhasLoading(false)
    }
  }, [])

  const invalidateTrilhas = useCallback(() => {
    _cache.trilhas.data = null
    _cache.trilhas.loadedAt = 0
  }, [])

  const getCachedTrilhas = useCallback(() => _cache.trilhas.data, [])

  // ── Progresso ──────────────────────────────────────────────────────────────

  const loadProgresso = useCallback(async (force = false): Promise<ProgressoBasico[]> => {
    const c = _cache.progresso
    if (!force && c.data !== null) return c.data

    setProgressoLoading(true)
    try {
      const data = await deduped('progresso', () =>
        fetch('/api/progresso').then(r => r.json())
      )
      const arr = Array.isArray(data) ? data : []
      _cache.progresso = { data: arr, loadedAt: Date.now() }
      return arr
    } catch {
      return _cache.progresso.data ?? []
    } finally {
      setProgressoLoading(false)
    }
  }, [])

  const addProgressoOptimistic = useCallback((
    etapaId: string,
    trilhaId: string,
    xpGanho = 0,
    estrelas = 0,
  ) => {
    if (!_cache.progresso.data) return
    // Only add if not already present (idempotent)
    const exists = _cache.progresso.data.some(p => p.etapaId === etapaId)
    if (!exists) {
      _cache.progresso.data = [
        ..._cache.progresso.data,
        { etapaId, trilhaId, xpGanho, estrelas, concluidaEm: new Date().toISOString() },
      ]
    }
    // Also update percentage in trilhas cache
    if (_cache.trilhas.data) {
      _cache.trilhas.data = _cache.trilhas.data.map(t => {
        if (t.id !== trilhaId) return t
        const exercicioEtapas = (t.etapas ?? []).filter(e => e.tipo === 'exercicio')
        const totalExercicios = exercicioEtapas.length
        const newConcluidas = t.etapasConcluidas + 1
        const pct = totalExercicios > 0 ? Math.min(100, Math.round((newConcluidas / totalExercicios) * 100)) : 0
        return { ...t, etapasConcluidas: newConcluidas, percentualConcluido: pct }
      })
    }
  }, [])

  const invalidateProgresso = useCallback(() => {
    _cache.progresso.data = null
    _cache.progresso.loadedAt = 0
  }, [])

  const getCachedProgresso = useCallback(() => _cache.progresso.data, [])

  // ── Ranking ────────────────────────────────────────────────────────────────

  const loadRanking = useCallback(async (force = false): Promise<RankUser[]> => {
    const c = _cache.ranking
    const isStale = Date.now() - c.loadedAt > RANKING_TTL
    if (!force && c.data !== null && !isStale) return c.data

    setRankingLoading(true)
    try {
      const data = await deduped('ranking', () =>
        fetch('/api/ranking').then(r => r.json())
      )
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

  const loadEtapa = useCallback(async (id: string, lang = 'pt'): Promise<any | null> => {
    const key = `${id}:${lang}`
    const cached = _cache.etapas[key]
    if (cached) return cached.data

    try {
      const data = await deduped(`etapa:${key}`, () =>
        fetch(`/api/etapa?id=${id}&lang=${lang}`).then(r => {
          if (!r.ok) throw new Error('not found')
          return r.json()
        })
      )
      _cache.etapas[key] = { data, loadedAt: Date.now() }
      return data
    } catch {
      return null
    }
  }, [])

  const prefetchEtapa = useCallback((id: string, lang = 'pt') => {
    const key = `${id}:${lang}`
    if (_cache.etapas[key]) return // already cached
    loadEtapa(id, lang).catch(() => {}) // fire and forget
  }, [loadEtapa])

  const getCachedEtapa = useCallback((id: string, lang = 'pt') => {
    return _cache.etapas[`${id}:${lang}`]?.data ?? null
  }, [])

  return (
    <AppDataContext.Provider value={{
      trilhasLoading,
      loadTrilhas,
      invalidateTrilhas,
      getCachedTrilhas,
      progressoLoading,
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
    }}>
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
