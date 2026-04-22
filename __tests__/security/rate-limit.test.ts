/**
 * Testes de segurança — Rate Limit
 *
 * Cobre dois mecanismos distintos:
 *
 * A) checkRateLimit (em memória)
 *    - Store em Map<string, {count, resetAt}>
 *    - Ideal para alta frequência onde vazamento entre instâncias é aceitável
 *    - Bloqueia na count >= maxAttempts: máximo maxAttempts requisições por janela
 *
 * B) checkRateLimitDB (banco de dados via $queryRaw)
 *    - INSERT … ON CONFLICT para atomicidade em múltiplas instâncias serverless
 *    - Bloqueia quando count > maxAttempts (permite exatamente maxAttempts chamadas)
 *    - Reset automático quando a janela expira (CASE WHEN reset_at < NOW())
 *    - Retorna retryAfterMs preciso para Retry-After header
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

import { checkRateLimit, checkRateLimitDB } from '../../lib/rate-limit'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// Utilitário: gera chaves únicas para evitar contaminação entre testes
// (checkRateLimit usa um Map módulo-global)
// ---------------------------------------------------------------------------
let keyCounter = 0
function uniqueKey(prefix = 'rl'): string {
  return `${prefix}-${Date.now()}-${++keyCounter}`
}

// ---------------------------------------------------------------------------
// Bloco A — checkRateLimit (em memória, síncrono)
// ---------------------------------------------------------------------------
describe('checkRateLimit (em memória)', () => {
  test('primeira chamada sempre é permitida', () => {
    const result = checkRateLimit(uniqueKey(), 3, 5_000)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBe(0)
  })

  test('exatamente maxAttempts=3 chamadas são permitidas', () => {
    const key = uniqueKey()
    for (let i = 0; i < 3; i++) {
      const r = checkRateLimit(key, 3, 5_000)
      expect(r.allowed).toBe(true)
    }
  })

  test('(maxAttempts + 1)ª chamada é bloqueada', () => {
    const key = uniqueKey()
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 5_000)
    const r = checkRateLimit(key, 3, 5_000)
    expect(r.allowed).toBe(false)
  })

  test('chamada bloqueada retorna retryAfterMs > 0', () => {
    const key = uniqueKey()
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 5_000)
    const r = checkRateLimit(key, 3, 5_000)
    expect(r.retryAfterMs).toBeGreaterThan(0)
    expect(r.retryAfterMs).toBeLessThanOrEqual(5_000)
  })

  test('chaves diferentes não interferem entre si', () => {
    const k1 = uniqueKey('a')
    const k2 = uniqueKey('b')

    for (let i = 0; i < 3; i++) checkRateLimit(k1, 3, 5_000)
    // k1 esgotou — mas k2 ainda não foi usado
    expect(checkRateLimit(k1, 3, 5_000).allowed).toBe(false)
    expect(checkRateLimit(k2, 3, 5_000).allowed).toBe(true)
  })

  test('após expirar a janela, o contador é resetado', () => {
    const key = uniqueKey()

    // Esgota o limite
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 1) // janela de 1ms
    expect(checkRateLimit(key, 3, 1).allowed).toBe(false)

    // Espera a janela expirar e chama novamente
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // Após expiração, a próxima chamada cria uma nova entrada
        const r = checkRateLimit(key, 3, 5_000)
        expect(r.allowed).toBe(true)
        resolve()
      }, 10) // 10ms > janela de 1ms
    })
  })

  test('maxAttempts=1: apenas 1 chamada permitida, 2ª bloqueada', () => {
    const key = uniqueKey()
    expect(checkRateLimit(key, 1, 5_000).allowed).toBe(true)
    expect(checkRateLimit(key, 1, 5_000).allowed).toBe(false)
  })

  test('maxAttempts=10: permite 10 chamadas consecutivas', () => {
    const key = uniqueKey()
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key, 10, 5_000).allowed).toBe(true)
    }
    expect(checkRateLimit(key, 10, 5_000).allowed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Bloco B — checkRateLimitDB (distribuído via SQL atômico)
// ---------------------------------------------------------------------------
describe('checkRateLimitDB (SQL atômico)', () => {
  const mockQueryRaw = prisma.$queryRaw as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Simula o retorno do INSERT … ON CONFLICT RETURNING
  function mockDbRow(count: number, resetAtMs = Date.now() + 5_000) {
    mockQueryRaw.mockResolvedValue([{ count, reset_at: new Date(resetAtMs) }])
  }

  test('primeira requisição (count=1) → permitida', async () => {
    mockDbRow(1)
    const r = await checkRateLimitDB('key-1', 3, 5_000)
    expect(r.allowed).toBe(true)
    expect(r.retryAfterMs).toBe(0)
  })

  test('count exatamente igual a maxAttempts → ainda permitida (count > max bloqueia)', async () => {
    mockDbRow(3) // count=3, maxAttempts=3: 3 > 3 é false → permitida
    const r = await checkRateLimitDB('key-2', 3, 5_000)
    expect(r.allowed).toBe(true)
  })

  test('count = maxAttempts + 1 → bloqueada', async () => {
    mockDbRow(4) // count=4, maxAttempts=3: 4 > 3 → bloqueada
    const r = await checkRateLimitDB('key-3', 3, 5_000)
    expect(r.allowed).toBe(false)
  })

  test('chamada bloqueada retorna retryAfterMs preciso', async () => {
    const resetAt = Date.now() + 3_000
    mockDbRow(4, resetAt)

    const r = await checkRateLimitDB('key-4', 3, 5_000)
    expect(r.allowed).toBe(false)
    // retryAfterMs deve ser próximo de 3000ms (com tolerância de ±100ms)
    expect(r.retryAfterMs).toBeGreaterThan(2_900)
    expect(r.retryAfterMs).toBeLessThanOrEqual(3_100)
  })

  test('banco retorna array vazio → tratado como permitido (fallback seguro)', async () => {
    mockQueryRaw.mockResolvedValue([])
    const r = await checkRateLimitDB('key-5', 3, 5_000)
    expect(r.allowed).toBe(true)
  })

  test('janela expirada (reset_at < NOW): INSERT reseta count para 1 → permitida', async () => {
    // O SQL usa CASE WHEN reset_at < NOW() THEN 1 — simula o reset
    mockDbRow(1, Date.now() + 5_000) // count voltou a 1 após reset
    const r = await checkRateLimitDB('key-6', 3, 5_000)
    expect(r.allowed).toBe(true)
  })

  test('executa exatamente 1 query SQL por chamada (atomicidade garantida)', async () => {
    mockDbRow(1)
    await checkRateLimitDB('key-7', 3, 5_000)
    // A função deve ser atômica — apenas 1 chamada ao DB por requisição
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })

  test('query SQL usa INSERT … ON CONFLICT com a chave correta', async () => {
    mockDbRow(1)
    const key = 'progresso:user-abc'
    await checkRateLimitDB(key, 100, 60_000)

    const queryCall = mockQueryRaw.mock.calls[0]
    // TemplateStringsArray — o primeiro argumento é o template literal
    // Verificamos que a query contém ON CONFLICT
    const queryParts = queryCall[0] as readonly string[]
    const fullQuery = queryParts.join('?')
    expect(fullQuery.toLowerCase()).toContain('on conflict')
    expect(fullQuery.toLowerCase()).toContain('insert')
  })

  test('chaves distintas são independentes (mocks chamados com chaves diferentes)', async () => {
    mockDbRow(1)
    await checkRateLimitDB('chave-a', 3, 5_000)

    mockDbRow(4) // segunda chave já está no limite
    await checkRateLimitDB('chave-b', 3, 5_000)

    // Cada chave usa seu próprio registro na tabela
    expect(mockQueryRaw).toHaveBeenCalledTimes(2)
  })

  test('maxAttempts=100 (progresso): count=101 → bloqueado', async () => {
    mockDbRow(101)
    const r = await checkRateLimitDB('progresso:u1', 100, 60 * 60 * 1_000)
    expect(r.allowed).toBe(false)
  })

  test('maxAttempts=5 (register): count=5 → permitido (5 > 5 é false)', async () => {
    mockDbRow(5)
    const r = await checkRateLimitDB('register:127.0.0.1', 5, 60 * 60 * 1_000)
    expect(r.allowed).toBe(true)
  })

  test('maxAttempts=5 (register): count=6 → bloqueado', async () => {
    mockDbRow(6)
    const r = await checkRateLimitDB('register:127.0.0.1', 5, 60 * 60 * 1_000)
    expect(r.allowed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Bloco C — Integridade semântica: limites usados em cada rota da aplicação
// ---------------------------------------------------------------------------
describe('Limites de rate limit por rota (contratos semânticos)', () => {
  const mockQueryRaw = prisma.$queryRaw as jest.Mock

  beforeEach(() => jest.clearAllMocks())

  function mockDbRow(count: number) {
    mockQueryRaw.mockResolvedValue([{ count, reset_at: new Date(Date.now() + 60_000) }])
  }

  test('/api/progresso: 100 submissões/hora — 100ª é permitida, 101ª bloqueada', async () => {
    mockDbRow(100)
    expect((await checkRateLimitDB('progresso:u1', 100, 3_600_000)).allowed).toBe(true)

    mockDbRow(101)
    expect((await checkRateLimitDB('progresso:u1', 100, 3_600_000)).allowed).toBe(false)
  })

  test('/api/auth/register: 5 cadastros/hora — 5ª é permitida, 6ª bloqueada', async () => {
    mockDbRow(5)
    expect((await checkRateLimitDB('register:192.168.1.1', 5, 3_600_000)).allowed).toBe(true)

    mockDbRow(6)
    expect((await checkRateLimitDB('register:192.168.1.1', 5, 3_600_000)).allowed).toBe(false)
  })

  test('/api/validar-query: 3 tentativas/5s (em memória) — 3ª permitida, 4ª bloqueada', () => {
    const key = uniqueKey('validar')
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 5_000).allowed).toBe(true)
    }
    expect(checkRateLimit(key, 3, 5_000).allowed).toBe(false)
  })
})
