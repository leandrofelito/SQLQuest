/** Campos de dica presentes em exercícios SQL e quiz (PT ou merge shallow). */
export type ConteudoComDicas = {
  dica?: string
  dicas?: string[]
}

export function normalizarDicas(c: ConteudoComDicas): string[] {
  const fromArr = (c.dicas ?? [])
    .map(s => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
  if (fromArr.length > 0) return fromArr
  const one = c.dica?.trim()
  if (one) return [one]
  return []
}
