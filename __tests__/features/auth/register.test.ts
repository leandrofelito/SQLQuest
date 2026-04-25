// ---------------------------------------------------------------------------
// Mocks — declarados antes dos imports (jest.mock é hoisted)
// ---------------------------------------------------------------------------
jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    verificationToken: { create: jest.fn() },
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  checkRateLimitDB: jest.fn(),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

jest.mock('@/lib/email', () => ({
  sendVerificationEmail: jest.fn().mockReturnValue(Promise.resolve()),
}))

jest.mock('@/features/auth/domain/nickname', () => ({
  contemPalavrão: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$fakehash'),
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/db'
import { checkRateLimitDB } from '@/lib/rate-limit'
import { contemPalavrão } from '@/features/auth/domain/nickname'

// Atalhos tipados para os mocks
const db = prisma as {
  user: { findUnique: jest.Mock; create: jest.Mock }
  verificationToken: { create: jest.Mock }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VALID_BODY = {
  firstName: 'Ana',
  lastName: 'Lima',
  nickname: 'ana_sql',
  email: 'ana@example.com',
  password: 'Segura@123',
}

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(checkRateLimitDB as jest.Mock).mockResolvedValue({ allowed: true })
  ;(contemPalavrão as jest.Mock).mockReturnValue(false)
  // Padrão: nenhum usuário existe (email e nickname livres)
  db.user.findUnique.mockResolvedValue(null)
  db.user.create.mockResolvedValue({ id: 'u-new' })
  db.verificationToken.create.mockResolvedValue({})
})

// ---------------------------------------------------------------------------
// Bloco 1 — Validação Zod: senha
// ---------------------------------------------------------------------------
describe('POST /api/auth/register — validação de senha', () => {
  test('senha com menos de 8 caracteres → 400 com mensagem', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, password: 'Abc@1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/ao menos 8 caracteres/i)
  })

  test('senha sem letra maiúscula → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, password: 'segura@123' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/maiúscula/i)
  })

  test('senha sem letra minúscula → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, password: 'SEGURA@123' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/minúscula/i)
  })

  test('senha sem número → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, password: 'Segura@abc' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/número/i)
  })

  test('senha sem caractere especial → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, password: 'Segura1234' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/caractere especial/i)
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Validação Zod: nickname
// ---------------------------------------------------------------------------
describe('POST /api/auth/register — validação de nickname', () => {
  test('nickname com menos de 3 caracteres → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, nickname: 'ab' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/ao menos 3 caracteres/i)
  })

  test('nickname com mais de 20 caracteres → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, nickname: 'a'.repeat(21) }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/no máximo 20 caracteres/i)
  })

  test('nickname com espaço (caractere inválido) → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, nickname: 'ana sql' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/letras, números e underscore/i)
  })

  test('nickname com hífen (caractere inválido) → 400', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, nickname: 'ana-sql' }))
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Unicidade de nickname
// ---------------------------------------------------------------------------
describe('POST /api/auth/register — unicidade', () => {
  test('nickname já em uso → 409 com mensagem', async () => {
    // Promise.all([email_check, nick_check]) → primeiro email, depois nick
    db.user.findUnique.mockImplementation(({ where }: any) => {
      if (where.nickname) return Promise.resolve({ id: 'u-existente' })
      return Promise.resolve(null) // email livre
    })

    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/nickname já está em uso/i)
  })

  test('email já cadastrado → 200 { ok: true } (sem enumerar emails)', async () => {
    // Rota retorna sucesso silencioso para não revelar emails cadastrados
    db.user.findUnique.mockImplementation(({ where }: any) => {
      if (where.email) return Promise.resolve({ id: 'u-existente' })
      return Promise.resolve(null) // nickname livre
    })

    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    // Não deve ter criado usuário nem token de verificação
    expect(db.user.create).not.toHaveBeenCalled()
    expect(db.verificationToken.create).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Rate limit
// ---------------------------------------------------------------------------
describe('POST /api/auth/register — rate limit', () => {
  test('IP com muitas tentativas → 429', async () => {
    ;(checkRateLimitDB as jest.Mock).mockResolvedValue({ allowed: false })
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toMatch(/muitas tentativas/i)
  })
})

// ---------------------------------------------------------------------------
// Bloco 5 — Cadastro bem-sucedido
// ---------------------------------------------------------------------------
describe('POST /api/auth/register — sucesso', () => {
  test('dados válidos → 200 { ok: true }, cria User e VerificationToken', async () => {
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(db.user.create).toHaveBeenCalledTimes(1)
    expect(db.verificationToken.create).toHaveBeenCalledTimes(1)
  })

  test('nickname com underscore e letras maiúsculas é aceito', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, nickname: 'Ana_SQL' }))
    expect(res.status).toBe(200)
  })
})
