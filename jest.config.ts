import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Exclui os testes E2E do Playwright (rodados separadamente via `npm run test:e2e`)
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverageFrom: [
    'lib/calculateProgress.ts',
    'lib/aplicar-prestigio.ts',
    'app/api/auth/register/route.ts',
    'app/api/progresso/route.ts',
  ],
}

export default createJestConfig(config)
