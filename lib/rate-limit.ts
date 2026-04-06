interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory per-instance store. Adequate for abuse prevention in serverless —
// each warm instance enforces the window independently.
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
