import { defineConfig, devices } from '@playwright/test'

/**
 * Variáveis de ambiente necessárias para rodar os testes E2E:
 *
 * NEXTAUTH_SECRET   — deve ser igual ao valor em .env.local (para cookies JWT válidos)
 * BASE_URL          — URL do servidor (padrão: http://localhost:3000)
 *
 * Exemplo de .env.test:
 *   NEXTAUTH_SECRET=minha-secret-do-projeto
 *   BASE_URL=http://localhost:3000
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    // Desktop Chrome — projeto principal
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Simula dispositivo mobile (verificação de responsividade)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Inicia o servidor de desenvolvimento automaticamente se não estiver rodando
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
