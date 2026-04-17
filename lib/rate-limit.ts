import { prisma } from './db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrai o IP real do cliente a partir dos headers do Vercel/proxies. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ---------------------------------------------------------------------------
// Rate limit em memória (por instância) — adequado para endpoints de alta
// frequência onde algum vazamento entre instâncias é aceitável (ex: validar-query).
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  maxAttempts = 3,
  windowMs = 5000
): { allowed: boolean; retryAfterMs: number } {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0 }
}

// ---------------------------------------------------------------------------
// Rate limit distribuído via banco de dados — funciona em múltiplas instâncias
// serverless. Use para endpoints sensíveis (cadastro, checkout, progresso).
//
// Usa INSERT … ON CONFLICT para garantir atomicidade no PostgreSQL — nenhuma
// race condition pode inflar o contador além do limite.
// ---------------------------------------------------------------------------

export async function checkRateLimitDB(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const resetAt = new Date(Date.now() + windowMs)

  // Operação atômica: insere com count=1 ou incrementa se ainda dentro da janela;
  // reseta automaticamente quando a janela expira.
  const rows = await prisma.$queryRaw<Array<{ count: number; reset_at: Date }>>`
    INSERT INTO rate_limit (key, count, reset_at)
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT (key) DO UPDATE SET
      count    = CASE WHEN rate_limit.reset_at < NOW() THEN 1
                      ELSE rate_limit.count + 1
                 END,
      reset_at = CASE WHEN rate_limit.reset_at < NOW() THEN ${resetAt}
                      ELSE rate_limit.reset_at
                 END
    RETURNING count, reset_at
  `

  const row = rows[0]
  if (!row) return { allowed: true, retryAfterMs: 0 }

  if (row.count > maxAttempts) {
    return {
      allowed: false,
      retryAfterMs: new Date(row.reset_at).getTime() - Date.now(),
    }
  }

  return { allowed: true, retryAfterMs: 0 }
}
