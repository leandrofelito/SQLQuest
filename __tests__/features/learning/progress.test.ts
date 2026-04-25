// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn().mockReturnValue(undefined) }),
}))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/locale', () => ({ COOKIE_NAME: 'NEXT_LOCALE' }))

jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    progresso: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    trilha: { findUnique: jest.fn() },
    certificado: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimitDB: jest.fn().mockResolvedValue({ allowed: true }),
}))

jest.mock('@/features/auth/domain/validation-token', () => ({ verificarToken: jest.fn() }))

jest.mock('@/features/gamification/domain/apply-prestige', () => ({
  aplicarPrestigioSeElegivelTx: jest.fn().mockResolvedValue({ applied: false }),
}))

jest.mock('@/features/ranking/domain/ranking-conquistas', () => ({
  verificarConquistasRanking: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/features/gamification/domain/streak', () => ({
  computeNovoStreak: jest.fn().mockReturnValue(1),
}))

jest.mock('@/features/gamification/domain/conquistas-definitions', () => ({
  TRILHA_CONQUISTA_SLUGS: [],
  TRILHA_CONQUISTAS: {},
  TRES_ESTRELAS_CONQUISTA: { id: 'tres-estrelas', emoji: '⭐', nome: '3 Estrelas' },
  trilhaConquistaId: jest.fn().mockReturnValue('conq-id'),
  novasConquistasExercicios: jest.fn().mockReturnValue([]),
  novasConquistasNivel: jest.fn().mockReturnValue([]),
  novasConquistasStreak: jest.fn().mockReturnValue([]),
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { salvarProgressoAction } from '@/features/learning/actions/progress.actions'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { verificarToken } from '@/features/auth/domain/validation-token'
import { aplicarPrestigioSeElegivelTx } from '@/features/gamification/domain/apply-prestige'

// ---------------------------------------------------------------------------
// Constantes de teste
// ---------------------------------------------------------------------------
const USER_ID = 'user-test-1'
const ETAPA_ID = 'etapa-abc'
const TRILHA_ID = 'trilha-xyz'

const SESSION_MOCK = { user: { id: USER_ID, name: 'Tester', email: 't@example.com' } }

const TOKEN_PAYLOAD_3_STARS = {
  userId: USER_ID,
  etapaId: ETAPA_ID,
  tentativas: 1,
  dicasUsadas: 0,
  exp: Date.now() + 60_000,
}

const TOKEN_PAYLOAD_2_STARS = {
  ...TOKEN_PAYLOAD_3_STARS,
  tentativas: 2,
}

const TOKEN_PAYLOAD_1_STAR = {
  ...TOKEN_PAYLOAD_3_STARS,
  tentativas: 3,
  dicasUsadas: 1,
}

const VALID_INPUT = { trilhaId: TRILHA_ID, etapaId: ETAPA_ID, token: 'tok-valido' }

const db = prisma as any

function setupDefaultMocks() {
  ;(getServerSession as jest.Mock).mockResolvedValue(SESSION_MOCK)
  ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_3_STARS)
  ;(aplicarPrestigioSeElegivelTx as jest.Mock).mockResolvedValue({ applied: false })

  db.progresso.findUnique.mockResolvedValue(null)
  db.progresso.count.mockResolvedValue(0)
  db.progresso.findMany.mockResolvedValue([])
  db.progresso.create.mockResolvedValue({ id: 'prog-1', estrelas: 3, xpGanho: 100 })
  db.progresso.update.mockResolvedValue({ id: 'prog-1', estrelas: 3, xpGanho: 100 })
  db.user.findUnique.mockResolvedValue({
    totalXp: 0,
    isPro: false,
    streak: 0,
    lastActiveAt: null,
  })
  db.user.update.mockResolvedValue({ totalXp: 100, xpRanking: 100 })
  db.trilha.findUnique.mockResolvedValue({ slug: 'trilha-test', etapas: [] })
  db.$transaction.mockImplementation((fn: Function) => fn(db))
}

beforeEach(() => {
  jest.clearAllMocks()
  setupDefaultMocks()
})

// ---------------------------------------------------------------------------
// Bloco 1 — Autenticação
// ---------------------------------------------------------------------------
describe('salvarProgressoAction — autenticação', () => {
  test('sem sessão → success: false com mensagem de erro', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/não autenticado/i)
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Validação de token HMAC
// ---------------------------------------------------------------------------
describe('salvarProgressoAction — token HMAC', () => {
  test('token inválido (verificarToken retorna null) → success: false', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue(null)
    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/token.*inválido|expirado/i)
  })

  test('token de outro usuário → success: false', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue({
      ...TOKEN_PAYLOAD_3_STARS,
      userId: 'outro-user-id',
    })
    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(false)
  })

  test('token para etapa diferente da enviada → success: false', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue({
      ...TOKEN_PAYLOAD_3_STARS,
      etapaId: 'etapa-errada',
    })
    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Primeiro progresso
// ---------------------------------------------------------------------------
describe('salvarProgressoAction — primeiro progresso', () => {
  test('primeira conclusão cria registro Progresso no banco', async () => {
    db.progresso.findUnique.mockResolvedValue(null)
    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(true)
    expect(db.progresso.create).toHaveBeenCalledTimes(1)
    expect(db.progresso.update).not.toHaveBeenCalled()
  })

  test('cria Progresso com os campos corretos (userId, trilhaId, etapaId, estrelas)', async () => {
    db.progresso.findUnique.mockResolvedValue(null)
    await salvarProgressoAction(VALID_INPUT)

    const createArgs = db.progresso.create.mock.calls[0][0]
    expect(createArgs.data).toMatchObject({
      userId: USER_ID,
      trilhaId: TRILHA_ID,
      etapaId: ETAPA_ID,
    })
    expect(createArgs.data.estrelas).toBeGreaterThanOrEqual(1)
    expect(createArgs.data.xpGanho).toBeGreaterThan(0)
  })

  test('primeira conclusão com 3 estrelas → xpGanho = 100 (base)', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_3_STARS)
    db.progresso.findUnique.mockResolvedValue(null)
    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(true)
    if (result.success && !result.jaFeito) {
      expect(result.xpGanho).toBe(100)
      expect(result.estrelas).toBe(3)
    }
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Restrição @@unique(userId, etapaId)
// ---------------------------------------------------------------------------
describe('salvarProgressoAction — @@unique userId_etapaId', () => {
  test('mesma etapa com estrelas iguais → jaFeito: true, sem novo create/update', async () => {
    const existente = { id: 'prog-existente', userId: USER_ID, etapaId: ETAPA_ID, estrelas: 3, xpGanho: 100 }
    db.progresso.findUnique.mockResolvedValue(existente)
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_3_STARS)

    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(true)
    if (result.success) expect(result.jaFeito).toBe(true)
    expect(db.progresso.create).not.toHaveBeenCalled()
    expect(db.progresso.update).not.toHaveBeenCalled()
  })

  test('mesma etapa com estrelas inferiores (regresso) → jaFeito: true', async () => {
    const existente = { id: 'prog-1', estrelas: 3, xpGanho: 100 }
    db.progresso.findUnique.mockResolvedValue(existente)
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_2_STARS)

    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(true)
    if (result.success) expect(result.jaFeito).toBe(true)
    expect(db.progresso.update).not.toHaveBeenCalled()
  })

  test('melhoria de 1 → 3 estrelas → update com delta XP (100 - 30 = 70)', async () => {
    const existente = { id: 'prog-1', estrelas: 1, xpGanho: 30 }
    db.progresso.findUnique.mockResolvedValue(existente)
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_3_STARS)

    const result = await salvarProgressoAction(VALID_INPUT)

    expect(result.success).toBe(true)
    if (result.success && !result.jaFeito) {
      // Apenas a diferença é concedida: 100 (3★) - 30 (1★) = 70
      expect(result.xpGanho).toBe(70)
      expect(result.estrelas).toBe(3)
    }
    expect(db.progresso.create).not.toHaveBeenCalled()
    expect(db.progresso.update).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Bloco 5 — xpRanking atualizado junto com totalXp
// ---------------------------------------------------------------------------
describe('salvarProgressoAction — xpRanking', () => {
  test('xpRanking é incrementado com o mesmo xpDelta que totalXp', async () => {
    db.progresso.findUnique.mockResolvedValue(null)
    await salvarProgressoAction(VALID_INPUT)

    const txUpdateCall = db.user.update.mock.calls[0]?.[0]
    expect(txUpdateCall?.data).toMatchObject({
      totalXp: { increment: expect.any(Number) },
      xpRanking: { increment: expect.any(Number) },
    })
    // Os dois deltas devem ser iguais
    expect(txUpdateCall?.data.totalXp.increment).toBe(txUpdateCall?.data.xpRanking.increment)
  })
})
