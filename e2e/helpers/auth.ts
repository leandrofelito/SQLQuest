/**
 * Helpers de autenticação para os testes E2E.
 *
 * Estratégia: cria um JWT válido para o NextAuth usando `encode` da lib `next-auth/jwt`,
 * com o mesmo NEXTAUTH_SECRET do servidor. O cookie é injetado no contexto do browser
 * antes da navegação — bypassa o formulário de login sem precisar de banco de dados.
 *
 * Pré-requisito: NEXTAUTH_SECRET deve ser o mesmo no servidor e neste helper.
 * Defina em .env.test ou exporte antes de rodar: NEXTAUTH_SECRET=<valor-do-.env.local>
 */
import { encode } from 'next-auth/jwt'
import type { BrowserContext, Page } from '@playwright/test'

const TEST_SECRET = process.env.NEXTAUTH_SECRET ?? 'fallback-test-secret-at-least-32-chars!'

// ---------------------------------------------------------------------------
// Perfis de usuário mock
// ---------------------------------------------------------------------------
export const USERS = {
  /** Usuário comum, sem Pro, XP baixo */
  regular: {
    id: 'e2e-user-regular-01',
    name: 'Tester Regular',
    email: 'regular@e2e.test',
    nickname: 'tester_regular',
    isPro: false,
    totalXp: 450,
    xpRanking: 450,
    streak: 2,
    prestige: 0,
  },
  /** Usuário Pro, XP alto */
  pro: {
    id: 'e2e-user-pro-01',
    name: 'Tester Pro',
    email: 'pro@e2e.test',
    nickname: 'tester_pro',
    isPro: true,
    totalXp: 12_000,
    xpRanking: 25_000,
    streak: 30,
    prestige: 0,
  },
} as const

export type MockUser = (typeof USERS)[keyof typeof USERS]

// ---------------------------------------------------------------------------
// Injeção de cookie JWT (bypassa formulário de login)
// ---------------------------------------------------------------------------
export async function setCookieAuth(context: BrowserContext, user: MockUser): Promise<void> {
  const tokenValue = await encode({
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: null,
      nickname: user.nickname,
    },
    secret: TEST_SECRET,
  })

  await context.addCookies([
    {
      name: 'next-auth.session-token',
      value: tokenValue,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

// ---------------------------------------------------------------------------
// Mock da rota /api/auth/session (alimenta hooks useSession/getServerSession)
// ---------------------------------------------------------------------------
export async function mockSessionRoute(page: Page, user: MockUser): Promise<void> {
  await page.route('**/api/auth/session', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: null,
          nickname: user.nickname,
          isPro: user.isPro,
          totalXp: user.totalXp,
          xpRanking: user.xpRanking,
          streak: user.streak,
          prestige: user.prestige,
        },
        expires: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    })
  )
}

// ---------------------------------------------------------------------------
// Setup completo: cookie + mock de rota (use em beforeEach)
// ---------------------------------------------------------------------------
export async function loginAs(page: Page, user: MockUser): Promise<void> {
  await setCookieAuth(page.context(), user)
  await mockSessionRoute(page, user)
}
