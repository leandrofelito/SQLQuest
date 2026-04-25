import crypto from 'crypto'

export interface ValidacaoPayload {
  userId: string
  etapaId: string
  tentativas: number
  dicasUsadas: number
  exp: number
}

function getSecret(): string {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET não configurado')
  return s
}

export function assinarToken(payload: ValidacaoPayload): string {
  const data = JSON.stringify(payload)
  const sig = crypto.createHmac('sha256', getSecret()).update(data).digest('hex')
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url')
}

export function verificarToken(token: string): ValidacaoPayload | null {
  try {
    const raw = JSON.parse(Buffer.from(token, 'base64url').toString())
    if (typeof raw.data !== 'string' || typeof raw.sig !== 'string') return null

    const expected = crypto.createHmac('sha256', getSecret()).update(raw.data).digest('hex')
    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(raw.sig, 'hex'))) {
      return null
    }

    const payload: ValidacaoPayload = JSON.parse(raw.data)
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null

    return payload
  } catch {
    return null
  }
}
