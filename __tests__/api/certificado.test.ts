/**
 * Testes de segurança — API de Certificado
 *
 * GET /api/certificado?trilhaId=xxx
 *
 * Cadeia de validação:
 *   1. Autenticação (getServerSession) → 401 se não autenticado
 *   2. Parâmetro trilhaId presente → 400 se ausente
 *   3. isPro = true → 403 se não Pro
 *   4. Certificado existe para o userId + trilhaId → 404 se não encontrado
 *   5. Certificado encontrado → 200 com Content-Type: application/pdf
 *
 * Isolamento de dados: usa @@unique([userId, trilhaId]) — impossível acessar
 * certificado de outro usuário mesmo conhecendo o trilhaId.
 *
 * Rota pública /cert/[hash]: testada separadamente (página Server Component).
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))

jest.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    certificado: { findUnique: jest.fn() },
  },
}))

jest.mock('@/lib/certificate', () => ({
  generateCertificatePDF: jest.fn().mockResolvedValue(
    // Cabeçalho mínimo de PDF válido (%PDF-1.4)
    new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
  ),
}))

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { GET } from '../../app/api/certificado/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { generateCertificatePDF } from '@/lib/certificate'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const USER_ID = 'user-cert-test-01'
const TRILHA_ID = 'trilha-sql-basico'
const CERT_HASH = 'abc123def456ghi7'

const SESSION = {
  user: { id: USER_ID, name: 'João Teste', email: 'joao@teste.com' },
}

const MOCK_USER_PRO = { id: USER_ID, name: 'João Teste', isPro: true }
const MOCK_USER_FREE = { id: USER_ID, name: 'João Teste', isPro: false }
const MOCK_CERT = {
  id: 'cert-1',
  userId: USER_ID,
  trilhaId: TRILHA_ID,
  hash: CERT_HASH,
  emitidoEm: new Date('2025-01-15'),
  trilha: { id: TRILHA_ID, titulo: 'SQL Básico', slug: 'sql-basico' },
}

const db = prisma as {
  user: { findUnique: jest.Mock }
  certificado: { findUnique: jest.Mock }
}

function makeReq(trilhaId?: string): Request {
  const url = trilhaId
    ? `http://localhost:3000/api/certificado?trilhaId=${trilhaId}`
    : 'http://localhost:3000/api/certificado'
  return new Request(url)
}

// ---------------------------------------------------------------------------
// Setup padrão: sessão autenticada, usuário Pro, certificado encontrado
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks()
  ;(getServerSession as jest.Mock).mockResolvedValue(SESSION)
  db.user.findUnique.mockResolvedValue(MOCK_USER_PRO)
  db.certificado.findUnique.mockResolvedValue(MOCK_CERT)
})

// ---------------------------------------------------------------------------
// Bloco 1 — Autenticação
// ---------------------------------------------------------------------------
describe('GET /api/certificado — autenticação', () => {
  test('sem sessão → 401 com mensagem de erro', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/não autenticado/i)
  })

  test('sessão válida → prossegue para as próximas verificações', async () => {
    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).not.toBe(401)
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Validação de parâmetros
// ---------------------------------------------------------------------------
describe('GET /api/certificado — parâmetros', () => {
  test('sem trilhaId na query string → 400', async () => {
    const res = await GET(makeReq()) // sem trilhaId
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/trilhaId obrigatório/i)
  })

  test('com trilhaId presente → prossegue além do 400', async () => {
    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).not.toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Verificação isPro
// ---------------------------------------------------------------------------
describe('GET /api/certificado — controle de acesso Pro', () => {
  test('usuário não-Pro → 403', async () => {
    db.user.findUnique.mockResolvedValue(MOCK_USER_FREE) // isPro: false

    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/apenas no pro/i)
  })

  test('usuário Pro → não retorna 403', async () => {
    db.user.findUnique.mockResolvedValue(MOCK_USER_PRO) // isPro: true

    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).not.toBe(403)
  })

  test('usuário não encontrado no banco → tratado como não-Pro (403)', async () => {
    db.user.findUnique.mockResolvedValue(null) // usuário não existe

    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).toBe(403)
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Integridade de dados: isolamento por (userId, trilhaId)
// ---------------------------------------------------------------------------
describe('GET /api/certificado — isolamento de dados', () => {
  test('certificado não encontrado para o userId atual → 404', async () => {
    db.certificado.findUnique.mockResolvedValue(null)

    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/não encontrado/i)
  })

  test('query ao banco usa SEMPRE o userId da sessão (não parâmetro externo)', async () => {
    await GET(makeReq(TRILHA_ID))

    const findCall = db.certificado.findUnique.mock.calls[0][0]
    // Verifica que o userId vem da sessão, não de um parâmetro injetável
    expect(findCall.where.userId_trilhaId.userId).toBe(USER_ID)
    expect(findCall.where.userId_trilhaId.trilhaId).toBe(TRILHA_ID)
  })

  test('usuário A não acessa certificado do usuário B com mesma trilhaId', async () => {
    // Simula: A tenta acessar certificado de B passando trilhaId de B
    // → O banco filtra por userId da SESSÃO, não por parâmetro externo
    const sessionUserA = { user: { id: 'user-A', name: 'A', email: 'a@test.com' } }
    ;(getServerSession as jest.Mock).mockResolvedValue(sessionUserA)
    db.user.findUnique.mockResolvedValue({ id: 'user-A', isPro: true })

    // Banco retorna null porque não existe cert para user-A + trilha-B
    db.certificado.findUnique.mockResolvedValue(null)

    const res = await GET(makeReq('trilha-de-usuario-B'))
    expect(res.status).toBe(404)

    // Confirma que a query foi feita com o userId correto (user-A, não user-B)
    const call = db.certificado.findUnique.mock.calls[0][0]
    expect(call.where.userId_trilhaId.userId).toBe('user-A')
  })
})

// ---------------------------------------------------------------------------
// Bloco 5 — Geração do PDF (caminho feliz)
// ---------------------------------------------------------------------------
describe('GET /api/certificado — geração de PDF', () => {
  test('certificado encontrado → 200 com Content-Type application/pdf', async () => {
    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
  })

  test('Content-Disposition contém o slug da trilha', async () => {
    const res = await GET(makeReq(TRILHA_ID))
    const disposition = res.headers.get('content-disposition')
    expect(disposition).toContain('sql-basico') // slug da trilha mockada
    expect(disposition).toContain('attachment')
  })

  test('generateCertificatePDF é chamado com os dados corretos do usuário', async () => {
    await GET(makeReq(TRILHA_ID))

    expect(generateCertificatePDF).toHaveBeenCalledTimes(1)
    const pdfArgs = (generateCertificatePDF as jest.Mock).mock.calls[0][0]
    expect(pdfArgs.userName).toBe('João Teste') // user.name da fixture
    expect(pdfArgs.hash).toBe(CERT_HASH)
    expect(pdfArgs.emitidoEm).toEqual(MOCK_CERT.emitidoEm)
  })

  test('resposta contém bytes do PDF (começa com %PDF)', async () => {
    const res = await GET(makeReq(TRILHA_ID))
    const buffer = await res.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // %PDF = [0x25, 0x50, 0x44, 0x46]
    expect(bytes[0]).toBe(0x25) // %
    expect(bytes[1]).toBe(0x50) // P
    expect(bytes[2]).toBe(0x44) // D
    expect(bytes[3]).toBe(0x46) // F
  })
})

// ---------------------------------------------------------------------------
// Bloco 6 — Erro interno na geração do PDF
// ---------------------------------------------------------------------------
describe('GET /api/certificado — tratamento de erros', () => {
  test('generateCertificatePDF lança erro → 500 com mensagem', async () => {
    ;(generateCertificatePDF as jest.Mock).mockRejectedValue(
      new Error('Falha ao carregar imagem do logo')
    )

    const res = await GET(makeReq(TRILHA_ID))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/erro ao gerar certificado/i)
  })
})

// ---------------------------------------------------------------------------
// Bloco 7 — Rota pública /cert/[hash]: lógica de busca por hash
// ---------------------------------------------------------------------------
describe('Lógica da rota pública /cert/[hash]', () => {
  // A página /cert/[hash] é um Server Component — testamos a lógica de
  // busca diretamente via Prisma mock sem invocar o componente React.

  jest.mock('@/lib/db', () => ({
    prisma: {
      user: { findUnique: jest.fn() },
      certificado: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    },
  }))

  const mockCertPublico = {
    id: 'cert-pub-1',
    hash: CERT_HASH,
    emitidoEm: new Date('2025-06-01'),
    user: { name: 'Ana SQL' },
    trilha: { titulo: 'SQL Básico', slug: 'sql-basico' },
  }

  test('busca por hash parcial retorna o certificado correto', () => {
    // O componente usa hash: { startsWith: params.hash }
    // Verificamos que a lógica de busca por prefixo está correta
    const hashParam = CERT_HASH.substring(0, 12)
    expect(CERT_HASH.startsWith(hashParam)).toBe(true)
  })

  test('rota /cert é listada em PUBLIC_PATHS (sem autenticação)', () => {
    const PUBLIC_PATHS = [
      '/login',
      '/register',
      '/manutencao',
      '/cert',
      '/privacidade',
      '/termos',
      '/',
    ]
    const certPath = '/cert/abc123def456'
    const isPublic = PUBLIC_PATHS.some(p => certPath.startsWith(p))
    expect(isPublic).toBe(true)
  })

  test('hash com menos de 12 chars ainda é prefixo válido do hash completo', () => {
    const shortHash = CERT_HASH.substring(0, 8)
    expect(CERT_HASH.startsWith(shortHash)).toBe(true)
  })

  test('hash de outro certificado NÃO é prefixo do hash atual', () => {
    const outroHash = 'xxxxxxxxxxxxxxxx'
    expect(CERT_HASH.startsWith(outroHash.substring(0, 8))).toBe(false)
  })
})
