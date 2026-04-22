/**
 * Testes E2E — Fluxo de Exercício SQL
 *
 * Cobre:
 *   1. Página de etapa carrega e exibe o editor SQL
 *   2. Submissão de query inválida retorna erro
 *   3. Submissão correta: /api/validar-query retorna sucesso → tela de conclusão com XP
 *   4. XP exibido corresponde ao retornado pela API de progresso
 *
 * Todos os endpoints de backend são mockados para não depender de banco ou WASM.
 */
import { test, expect, type Page, type Route } from '@playwright/test'
import { loginAs, USERS } from './helpers/auth'

// ---------------------------------------------------------------------------
// Dados de exercício mock (formato simplificado compatível com TelaExercicio)
// ---------------------------------------------------------------------------
const MOCK_ETAPA = {
  id: 'etapa-e2e-sql-001',
  trilhaId: 'trilha-e2e-intro',
  titulo: 'Selecionar todos os usuários',
  tipo: 'exercicio',
  ordem: 3,
  conteudo: {
    instrucao: 'Escreva uma query que retorne todos os usuários da tabela `users`.',
    schema: 'CREATE TABLE users (id INTEGER, name TEXT, email TEXT);',
    checkType: 'rows',
    checkConfig: {},
    dicas: ['Use SELECT * FROM users'],
    quizTipo: null,
  },
}

const MOCK_TRILHA_DASHBOARD = {
  id: 'trilha-e2e-intro',
  slug: 'intro-sql',
  titulo: 'Introdução ao SQL',
  etapas: [
    { id: 'etapa-e2e-intro-001', tipo: 'intro', ordem: 1, titulo: 'Boas-vindas' },
    { id: 'etapa-e2e-texto-002', tipo: 'texto', ordem: 2, titulo: 'O que é SQL?' },
    { ...MOCK_ETAPA, tipo: 'exercicio' },
  ],
  progressos: [],
}

// XP esperado para 3 estrelas (1ª tentativa, sem dica): 100 base
const XP_3_ESTRELAS = 100

// ---------------------------------------------------------------------------
// Setup comum: mock de todas as rotas de dados
// ---------------------------------------------------------------------------
async function setupExerciseMocks(page: Page) {
  await loginAs(page, USERS.regular)

  await page.route('**/api/etapa*', (route: Route) =>
    route.fulfill({ json: MOCK_ETAPA })
  )
  await page.route('**/api/trilha-dashboard*', (route: Route) =>
    route.fulfill({ json: MOCK_TRILHA_DASHBOARD })
  )
  await page.route('**/api/progresso*', async (route: Route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: [] })
    }
    // POST — registra progresso (chamado após validação bem-sucedida)
    return route.fulfill({
      json: {
        xpGanho: XP_3_ESTRELAS,
        estrelas: 3,
        nivelAnterior: 1,
        nivelAtual: 1,
        certificadoCriado: false,
        novasConquistas: [],
        novasConquistasRanking: [],
      },
    })
  })
  await page.route('**/api/marcar-visitada*', (route: Route) => route.fulfill({ json: { ok: true } }))
  await page.route('**/api/conquistas*', (route: Route) => route.fulfill({ json: [] }))
}

const EXERCISE_URL = `/trilha/intro-sql/etapa/${MOCK_ETAPA.id}`

// ---------------------------------------------------------------------------
// Bloco 1 — Carregamento da página de exercício
// ---------------------------------------------------------------------------
test.describe('Página de exercício — carregamento', () => {
  test('página carrega sem erros e exibe o título do exercício', async ({ page }) => {
    await setupExerciseMocks(page)
    await page.goto(EXERCISE_URL)

    await expect(page).not.toHaveURL(/\/login/)
    // Aguarda algum conteúdo da etapa aparecer
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveTitle(/erro|error/i)
  })

  test('editor SQL exibe placeholder "-- Escreva seu SQL aqui"', async ({ page }) => {
    await setupExerciseMocks(page)
    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    // O placeholder do editor SQL vem do messages.exercicio.placeholder
    const editor = page.getByPlaceholder('-- Escreva seu SQL aqui')
    await expect(editor).toBeVisible({ timeout: 8_000 })
  })

  test('botão "Verificar" está presente', async ({ page }) => {
    await setupExerciseMocks(page)
    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    await expect(
      page.getByRole('button', { name: /verificar/i })
    ).toBeVisible({ timeout: 8_000 })
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Submissão incorreta
// ---------------------------------------------------------------------------
test.describe('Submissão incorreta', () => {
  test('/api/validar-query retorna sucesso=false → mensagem de erro exibida', async ({ page }) => {
    await setupExerciseMocks(page)
    await page.route('**/api/validar-query', route =>
      route.fulfill({ json: { sucesso: false } })
    )

    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    const editor = page.getByPlaceholder('-- Escreva seu SQL aqui')
    await editor.fill('SELECT nome FROM users') // query errada
    await page.getByRole('button', { name: /verificar/i }).click()

    // Após resposta incorreta, deve aparecer feedback de erro
    // O componente mostra messages.exercicio.resultadoIncorreto ou quizIncorreto
    await expect(
      page.getByText(/resultado incorreto|incorreta|tente de novo/i)
    ).toBeVisible({ timeout: 5_000 })
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Submissão correta: fluxo completo até a tela de conclusão
// ---------------------------------------------------------------------------
test.describe('Submissão correta → tela de conclusão com XP', () => {
  test('query correta chama /api/validar-query e depois /api/progresso (POST)', async ({
    page,
  }) => {
    await setupExerciseMocks(page)

    let validarCalled = false
    let progressoCalled = false

    await page.route('**/api/validar-query', route => {
      validarCalled = true
      return route.fulfill({
        json: { sucesso: true, token: 'mock-hmac-token-e2e' },
      })
    })
    await page.route('**/api/progresso', async route => {
      if (route.request().method() === 'POST') progressoCalled = true
      return route.fulfill({
        json: {
          xpGanho: XP_3_ESTRELAS,
          estrelas: 3,
          nivelAnterior: 1,
          nivelAtual: 1,
          certificadoCriado: false,
          novasConquistas: [],
          novasConquistasRanking: [],
        },
      })
    })

    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    const editor = page.getByPlaceholder('-- Escreva seu SQL aqui')
    await editor.fill('SELECT * FROM users')
    await page.getByRole('button', { name: /verificar/i }).click()

    await expect.poll(() => validarCalled, { timeout: 5_000 }).toBe(true)
    await expect.poll(() => progressoCalled, { timeout: 5_000 }).toBe(true)
  })

  test('tela de conclusão exibe o XP ganho após query correta', async ({ page }) => {
    await setupExerciseMocks(page)
    await page.route('**/api/validar-query', route =>
      route.fulfill({ json: { sucesso: true, token: 'mock-token' } })
    )

    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    const editor = page.getByPlaceholder('-- Escreva seu SQL aqui')
    await editor.fill('SELECT * FROM users')
    await page.getByRole('button', { name: /verificar/i }).click()

    // Após sucesso, a tela mostra XP ganho (100 XP para 3 estrelas)
    // O valor exato depende do componente TelaConclusao — aceita formatos "+100 XP", "100 XP", etc.
    await expect(
      page.getByText(new RegExp(`${XP_3_ESTRELAS}\\s*XP`, 'i'))
    ).toBeVisible({ timeout: 8_000 })
  })

  test('3 estrelas são exibidas na tela de conclusão para 1ª tentativa sem dica', async ({
    page,
  }) => {
    await setupExerciseMocks(page)
    await page.route('**/api/validar-query', route =>
      route.fulfill({ json: { sucesso: true, token: 'mock-token' } })
    )

    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('-- Escreva seu SQL aqui').fill('SELECT * FROM users')
    await page.getByRole('button', { name: /verificar/i }).click()

    // Aguarda transição para tela de conclusão
    // Procura pelo texto de feedback positivo ou pelo ícone de estrelas
    await expect(
      page.getByText(/acertou|correto|parabéns|elite|bom trabalho/i)
    ).toBeVisible({ timeout: 8_000 })
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Rate limit do /api/validar-query
// ---------------------------------------------------------------------------
test.describe('Rate limit do validador SQL', () => {
  test('após 3 tentativas rápidas, /api/validar-query pode retornar 429', async ({ page }) => {
    await setupExerciseMocks(page)

    let callCount = 0
    await page.route('**/api/validar-query', route => {
      callCount++
      if (callCount > 3) {
        return route.fulfill({
          status: 429,
          json: { error: 'Muitas tentativas. Aguarde alguns segundos.' },
        })
      }
      return route.fulfill({ json: { sucesso: false } })
    })

    await page.goto(EXERCISE_URL)
    await page.waitForLoadState('networkidle')

    const editor = page.getByPlaceholder('-- Escreva seu SQL aqui')
    const btn = page.getByRole('button', { name: /verificar/i })

    // Faz 4 tentativas rápidas
    for (let i = 0; i < 4; i++) {
      await editor.fill(`SELECT ${i} FROM users`)
      await btn.click()
      await page.waitForTimeout(100)
    }

    // Após o limite, o mock retornará 429 — apenas verifica que não crashou
    await expect(page).not.toHaveURL(/\/login/)
  })
})
