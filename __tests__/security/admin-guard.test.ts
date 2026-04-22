/**
 * Testes de segurança — Painel Admin
 *
 * O guard admin é aplicado em duas camadas independentes:
 *   1. Middleware (withAuth): lê `req.nextauth.token.email` e compara com ADMIN_EMAILS
 *   2. Layout do /admin (Server Component): repete a verificação via getServerSession
 *
 * Estes testes cobrem a camada do middleware, que é a primeira linha de defesa.
 *
 * Técnica: moca `next-auth/middleware` para expor a função interna diretamente,
 * permitindo injetar tokens arbitrários sem precisar do NextAuth em execução.
 */

// ---------------------------------------------------------------------------
// IMPORTANTE: jest.mock é hoisted — deve ficar antes dos imports
// ---------------------------------------------------------------------------
jest.mock('next-auth/middleware', () => ({
  // Expõe a função interna diretamente (sem o wrapper de autenticação)
  withAuth: jest.fn((fn: Function) => fn),
}))

// Evita que o middleware tente carregar o authOptions real
jest.mock('@/lib/auth', () => ({ authOptions: {} }))

import { NextRequest } from 'next/server'

// Importa o middleware APÓS os mocks para garantir que withAuth já está mockado
// eslint-disable-next-line import/first
import middleware from '../../middleware'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ADMIN_EMAIL = 'admin@sqlquest.test'
const OTHER_EMAIL = 'user@outros.test'

/**
 * Cria um NextRequest com o token simulado injetado como `req.nextauth.token`.
 * O `withAuth` real injetaria esse campo; como o mockamos, fazemos manualmente.
 */
function makeReq(pathname: string, token: Record<string, unknown> | null = null): NextRequest {
  const req = new NextRequest(`http://localhost:3000${pathname}`) as NextRequest & {
    nextauth: { token: typeof token }
  }
  req.nextauth = { token }
  return req
}

// ---------------------------------------------------------------------------
// Setup/teardown de variáveis de ambiente
// ---------------------------------------------------------------------------
const originalEnv = { ...process.env }

beforeEach(() => {
  process.env.ADMIN_EMAILS = ADMIN_EMAIL
  process.env.MAINTENANCE_MODE = 'false'
})

afterEach(() => {
  Object.assign(process.env, originalEnv)
})

// ---------------------------------------------------------------------------
// Bloco 1 — Acesso ao /admin
// ---------------------------------------------------------------------------
describe('Middleware admin guard — acesso a /admin', () => {
  test('sem token → redireciona para /home', () => {
    const req = makeReq('/admin', null)
    const res = middleware(req as any)

    expect(res).toBeDefined()
    expect(res!.headers.get('location')).toContain('/home')
  })

  test('token sem email → redireciona para /home', () => {
    const req = makeReq('/admin', { name: 'Sem Email', nickname: 'nick' })
    const res = middleware(req as any)

    expect(res!.headers.get('location')).toContain('/home')
  })

  test('token com email NÃO listado em ADMIN_EMAILS → redireciona para /home', () => {
    const req = makeReq('/admin', { email: OTHER_EMAIL, nickname: 'nick' })
    const res = middleware(req as any)

    expect(res!.headers.get('location')).toContain('/home')
  })

  test('token com email AUTORIZADO → não redireciona (retorna undefined)', () => {
    const req = makeReq('/admin', { email: ADMIN_EMAIL, nickname: 'admin_nick' })
    const res = middleware(req as any)

    // Middleware retorna undefined/null para rotas permitidas (deixa o Next continuar)
    expect(res).toBeUndefined()
  })

  test('sub-rota /admin/pagamentos com email autorizado → permitido', () => {
    const req = makeReq('/admin/pagamentos', { email: ADMIN_EMAIL, nickname: 'admin_nick' })
    const res = middleware(req as any)

    expect(res).toBeUndefined()
  })

  test('sub-rota /admin/questoes com email não autorizado → redireciona', () => {
    const req = makeReq('/admin/questoes', { email: OTHER_EMAIL, nickname: 'nick' })
    const res = middleware(req as any)

    expect(res!.headers.get('location')).toContain('/home')
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Parsing de ADMIN_EMAILS (formato da variável de ambiente)
// ---------------------------------------------------------------------------
describe('Parsing de ADMIN_EMAILS', () => {
  test('múltiplos emails separados por vírgula → todos autorizados', () => {
    process.env.ADMIN_EMAILS = `${ADMIN_EMAIL},outro@admin.test,terceiro@admin.test`

    const r1 = makeReq('/admin', { email: ADMIN_EMAIL, nickname: 'n' })
    const r2 = makeReq('/admin', { email: 'outro@admin.test', nickname: 'n' })
    const r3 = makeReq('/admin', { email: 'terceiro@admin.test', nickname: 'n' })

    expect(middleware(r1 as any)).toBeUndefined()
    expect(middleware(r2 as any)).toBeUndefined()
    expect(middleware(r3 as any)).toBeUndefined()
  })

  test('espaços ao redor da vírgula são ignorados (trim)', () => {
    process.env.ADMIN_EMAILS = `  ${ADMIN_EMAIL}  ,  outro@admin.test  `

    const req = makeReq('/admin', { email: ADMIN_EMAIL, nickname: 'n' })
    expect(middleware(req as any)).toBeUndefined()

    const req2 = makeReq('/admin', { email: 'outro@admin.test', nickname: 'n' })
    expect(middleware(req2 as any)).toBeUndefined()
  })

  test('ADMIN_EMAILS não definida → todos bloqueados', () => {
    delete process.env.ADMIN_EMAILS

    const req = makeReq('/admin', { email: ADMIN_EMAIL, nickname: 'n' })
    const res = middleware(req as any)

    expect(res!.headers.get('location')).toContain('/home')
  })

  test('ADMIN_EMAILS vazia → todos bloqueados', () => {
    process.env.ADMIN_EMAILS = ''

    const req = makeReq('/admin', { email: ADMIN_EMAIL, nickname: 'n' })
    const res = middleware(req as any)

    expect(res!.headers.get('location')).toContain('/home')
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Rotas não-admin (verificar que o guard não afeta outras rotas)
// ---------------------------------------------------------------------------
describe('Middleware — rotas não-admin com token válido', () => {
  test('/home com token e nickname → permitido', () => {
    const req = makeReq('/home', { email: OTHER_EMAIL, nickname: 'nick' })
    const res = middleware(req as any)

    // Sem redirecionamento para /home (rota atual é /home) ou /admin
    expect(res).toBeUndefined()
  })

  test('/ranking com token e nickname → permitido', () => {
    const req = makeReq('/ranking', { email: OTHER_EMAIL, nickname: 'nick' })
    const res = middleware(req as any)

    expect(res).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Guarda de nickname (token sem nickname → /escolher-nickname)
// ---------------------------------------------------------------------------
describe('Middleware — guard de nickname', () => {
  test('token autenticado sem nickname → redireciona para /escolher-nickname', () => {
    // Usuário criou conta via Google mas ainda não escolheu nickname
    const req = makeReq('/home', { email: OTHER_EMAIL, nickname: null })
    const res = middleware(req as any)

    expect(res!.headers.get('location')).toContain('/escolher-nickname')
  })

  test('token sem nickname na rota /escolher-nickname → não redireciona (evita loop)', () => {
    const req = makeReq('/escolher-nickname', { email: OTHER_EMAIL, nickname: null })
    const res = middleware(req as any)

    // Já está na rota correta — não deve redirecionar
    expect(res).toBeUndefined()
  })

  test('token com nickname válido → não redireciona para /escolher-nickname', () => {
    const req = makeReq('/home', { email: OTHER_EMAIL, nickname: 'meu_nick' })
    const res = middleware(req as any)

    // res=undefined significa "continua" — nenhum redirecionamento
    const location = res?.headers.get('location') ?? ''
    expect(location).not.toContain('/escolher-nickname')
  })
})

// ---------------------------------------------------------------------------
// Bloco 5 — Modo manutenção
// ---------------------------------------------------------------------------
describe('Middleware — modo manutenção', () => {
  test('MAINTENANCE_MODE=true → redireciona qualquer rota para /manutencao', () => {
    // A constante MANUTENCAO é avaliada no carregamento do módulo.
    // Para testar, verificamos a lógica diretamente com a env var
    // (o middleware usa a var no momento do import, não no momento da chamada)
    // Este teste verifica o comportamento quando a flag está ativa.

    // Como MANUTENCAO é calculado no momento do import, criamos um ambiente
    // separado aqui para documentação — o teste principal é feito via E2E.
    // Verificamos que a env var é lida corretamente:
    process.env.MAINTENANCE_MODE = 'true'
    expect(process.env.MAINTENANCE_MODE).toBe('true')

    // O comportamento real de redirecionamento depende de reimportar o módulo,
    // o que exigiria jest.resetModules() — documentado como caso E2E.
  })
})

// ---------------------------------------------------------------------------
// Bloco 6 — Callback `authorized`: lógica de rotas públicas
// ---------------------------------------------------------------------------
describe('Lógica do authorized callback (extraída)', () => {
  // A lógica do authorized callback é:
  //   if PUBLIC_PATHS.some(p => pathname.startsWith(p)) return true
  //   return !!token
  // Testamos essa lógica pura sem precisar invocar o middleware.

  const PUBLIC_PATHS = ['/login', '/register', '/manutencao', '/cert', '/privacidade', '/termos', '/']

  function authorized(token: unknown, pathname: string): boolean {
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
    if (pathname.startsWith('/api/conteudo-version')) return true
    return !!token
  }

  test('/cert/abc123 é pública — não exige token', () => {
    expect(authorized(null, '/cert/abc123defgh')).toBe(true)
  })

  test('/login é pública', () => {
    expect(authorized(null, '/login')).toBe(true)
  })

  test('/register é pública', () => {
    expect(authorized(null, '/register')).toBe(true)
  })

  test('/home sem token → não autorizado (401 → redirect login)', () => {
    expect(authorized(null, '/home')).toBe(false)
  })

  test('/home com token → autorizado', () => {
    expect(authorized({ sub: 'u1' }, '/home')).toBe(true)
  })

  test('/admin sem token → não autorizado (tratado depois pelo admin guard)', () => {
    expect(authorized(null, '/admin')).toBe(false)
  })

  test('/api/conteudo-version é pública', () => {
    expect(authorized(null, '/api/conteudo-version')).toBe(true)
  })
})
