'use client'
import { useState, useEffect } from 'react'
import type { TrilhaComProgresso } from '@/types'

export function useTrilha() {
  const [trilhas, setTrilhas] = useState<TrilhaComProgresso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trilhas')
      .then(r => r.json())
      .then(data => {
        setTrilhas(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return { trilhas, loading }
}
