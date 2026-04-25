'use client'
import { useEffect, useState } from 'react'
import { initSQL, closeSQL, executarSQL, type QueryResult } from '@/features/sql-engine/domain/sql-runner'

export function useSQL() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    initSQL()
      .then(() => { if (!cancelled) setReady(true) })
      .catch(e => { if (!cancelled) setError(String(e)) })
    return () => {
      cancelled = true
      closeSQL()
    }
  }, [])

  function run(schema: string, query: string): QueryResult[] {
    return executarSQL(schema, query)
  }

  return { ready, run, error }
}
