'use client'
import { useEffect, useState } from 'react'
import { initSQL, executarSQL, type QueryResult } from '@/lib/sql-runner'

export function useSQL() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initSQL()
      .then(() => setReady(true))
      .catch(e => setError(String(e)))
  }, [])

  function run(schema: string, query: string): QueryResult[] {
    return executarSQL(schema, query)
  }

  return { ready, run, error }
}
