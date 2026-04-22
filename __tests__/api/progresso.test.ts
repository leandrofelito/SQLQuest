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

jest.mock('@/lib/validacao-token', () => ({ verificarToken: jest.fn() }))

jest.mock('@/lib/aplicar-prestigio', () => ({
  aplicarPrestigioSeElegivelTx: jest.fn().mockResolvedValue({ applied: false }),
}))

jest.mock('@/lib/ranking-conquistas', () => ({
  verificarConquistasRanking: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/lib/streak', () => ({
  computeNovoStreak: jest.fn().mockReturnValue(1),
}))

jest.mock('@/lib/conquistas-definitions', () => ({
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
import { POST } from '../../app/api/progresso/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { verificarToken } from '@/lib/validacao-token'
import { aplicarPrestigioSeElegivelTx } from '@/lib/aplicar-prestigio'

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/progresso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { trilhaId: TRILHA_ID, etapaId: ETAPA_ID, token: 'tok-valido' }

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
describe('POST /api/progresso — autenticação', () => {
  test('sem sessão → 401', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/não autenticado/i)
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Validação de token HMAC
// ---------------------------------------------------------------------------
describe('POST /api/progresso — token HMAC', () => {
  test('token inválido (verificarToken retorna null) → 403', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue(null)
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/token.*inválido|expirado/i)
  })

  test('token de outro usuário → 403', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue({
      ...TOKEN_PAYLOAD_3_STARS,
      userId: 'outro-user-id', // userId do token ≠ userId da sessão
    })
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(403)
  })

  test('token para etapa diferente da enviada → 403', async () => {
    ;(verificarToken as jest.Mock).mockReturnValue({
      ...TOKEN_PAYLOAD_3_STARS,
      etapaId: 'etapa-errada',
    })
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Primeiro progresso (@@unique userId_etapaId)
// ---------------------------------------------------------------------------
describe('POST /api/progresso — primeiro progresso', () => {
  test('primeira conclusão cria registro Progresso no banco', async () => {
    db.progresso.findUnique.mockResolvedValue(null) // sem registro anterior
    const res = await POST(makeReq(VALID_BODY))

    expect(res.status).toBe(200)
    expect(db.progresso.create).toHaveBeenCalledTimes(1)
    expect(db.progresso.update).not.toHaveBeenCalled()
  })

  test('cria Progresso com os campos corretos (userId, trilhaId, etapaId, estrelas)', async () => {
    db.progresso.findUnique.mockResolvedValue(null)
    await POST(makeReq(VALID_BODY))

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
    const res = await POST(makeReq(VALID_BODY))
    const body = await res.json()

    // xpGanho na resposta reflete o xpDelta, que para 3 estrelas = 100 (base star XP)
    expect(body.xpGanho).toBe(100)
    expect(body.estrelas).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Restrição @@unique(userId, etapaId)
// ---------------------------------------------------------------------------
describe('POST /api/progresso — @@unique userId_etapaId', () => {
  test('mesma etapa com estrelas iguais → jaFeito: true, sem novo create/update', async () => {
    const existente = {
      id: 'prog-existente',
      userId: USER_ID,
      etapaId: ETAPA_ID,
      estrelas: 3,
      xpGanho: 100,
    }
    db.progresso.findUnique.mockResolvedValue(existente)
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_3_STARS) // ainda 3 estrelas

    const res = await POST(makeReq(VALID_BODY))
    const body = await res.json()

    expect(body.jaFeito).toBe(true)
    expect(body.xpGanho).toBe(0)
    expect(db.progresso.create).not.toHaveBeenCalled()
    expect(db.progresso.update).not.toHaveBeenCalled()
  })

  test('mesma etapa com estrelas inferiores (regresso) → jaFeito: true', async () => {
    // Usuário já tem 3 estrelas, submete novamente com 2 estrelas
    const existente = { id: 'prog-1', estrelas: 3, xpGanho: 100 }
    db.progresso.findUnique.mockResolvedValue(existente)
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_2_STARS) // 2 estrelas

    const res = await POST(makeReq(VALID_BODY))
    const body = await res.json()

    expect(body.jaFeito).toBe(true)
    expect(db.progresso.update).not.toHaveBeenCalled()
  })

  test('melhoria de 1 → 3 estrelas → update com delta XP (100 - 30 = 70)', async () => {
    // Registro anterior com 1 estrela (xpGanho=30)
    const existente = { id: 'prog-1', estrelas: 1, xpGanho: 30 }
    db.progresso.findUnique.mockResolvedValue(existente)
    ;(verificarToken as jest.Mock).mockReturnValue(TOKEN_PAYLOAD_3_STARS) // 3 estrelas (melhoria)

    const res = await POST(makeReq(VALID_BODY))
    const body = await res.json()

    // Apenas a diferença é concedida: 100 (3★) - 30 (1★) = 70
    expect(body.xpGanho).toBe(70)
    expect(body.estrelas).toBe(3)
    expect(db.progresso.create).not.toHaveBeenCalled()
    expect(db.progresso.update).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Bloco 5 — xpRanking atualizado junto com totalXp
// ---------------------------------------------------------------------------
describe('POST /api/progresso — xpRanking', () => {
  test('xpRanking é incrementado com o mesmo xpDelta que totalXp', async () => {
    db.progresso.findUnique.mockResolvedValue(null)
    await POST(makeReq(VALID_BODY))

    // O update do user (dentro da transação) deve conter ambos os increments
    const txUpdateCall = db.user.update.mock.calls[0]?.[0]
    expect(txUpdateCall?.data).toMatchObject({
      totalXp: { increment: expect.any(Number) },
      xpRanking: { increment: expect.any(Number) },
    })
    // Os dois deltas devem ser iguais
    expect(txUpdateCall?.data.totalXp.increment).toBe(txUpdateCall?.data.xpRanking.increment)
  })
})
