import { PrismaClient } from '@prisma/client'

// Padrão singleton serverless-safe:
// - Em desenvolvimento: globalThis evita múltiplas instâncias durante hot-module reload.
// - Em produção (serverless): o cache de módulo do Node.js garante uma única instância
//   por container Lambda. NÃO armazenamos em globalThis em produção para não vazar estado
//   entre invocações em ambientes que reutilizam o globalThis entre requests.
//
// Pré-requisito de ambiente:
//   DATABASE_URL → URL do pooler Neon (host com "-pooler"), com ?pgbouncer=true&connection_limit=1
//   DIRECT_URL   → URL direta do Neon (sem "-pooler"), usada pelo `prisma migrate` / `db push`
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
