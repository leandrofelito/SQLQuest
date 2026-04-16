'use client'
import { useCallback, useState } from 'react'

export interface UseDicasOptions {
  listaDicas: string[]
  isPro: boolean
  /** Chamado após a primeira dica ser revelada; use para aplicar preenchimento no editor */
  onPrimeiraDica?: () => void
}

export interface UseDicasReturn {
  dicasReveladas: string[]
  dicasUsadas: number
  showAnuncioDica: boolean
  podeVerMaisDicas: boolean
  pedirDica: () => void
  liberarProximaDica: () => void
  fecharAnuncio: () => void
}

/**
 * Gerencia o estado e a lógica do sistema de dicas.
 *
 * Usa updater funcional no setDicasReveladas para evitar closure stale:
 * o índice da próxima dica é lido de `prev.length` (estado atual na fila de
 * atualização do React), não de uma cópia capturada no momento da criação
 * do callback.
 */
export function useDicas({
  listaDicas,
  isPro,
  onPrimeiraDica,
}: UseDicasOptions): UseDicasReturn {
  const [dicasReveladas, setDicasReveladas] = useState<string[]>([])
  const [dicasUsadas, setDicasUsadas] = useState(0)
  const [showAnuncioDica, setShowAnuncioDica] = useState(false)

  const podeVerMaisDicas = dicasReveladas.length < listaDicas.length

  const pedirDica = useCallback(() => {
    if (listaDicas.length === 0) return
    if (dicasReveladas.length >= listaDicas.length) return

    if (isPro) {
      // Pro: revela todas de uma vez (conta como 1 uso)
      if (dicasReveladas.length > 0) return
      onPrimeiraDica?.()
      setDicasReveladas([...listaDicas])
      setDicasUsadas(1)
      return
    }

    setShowAnuncioDica(true)
  }, [isPro, listaDicas, dicasReveladas.length, onPrimeiraDica])

  /**
   * Chamado pelo onConcluido do AnuncioVideo.
   * Usa updater funcional para garantir leitura do estado atual,
   * eliminando o risco de closure stale que impedia a exibição da dica.
   */
  const liberarProximaDica = useCallback(() => {
    setShowAnuncioDica(false)

    setDicasReveladas(prev => {
      const idx = prev.length
      if (idx >= listaDicas.length) return prev
      if (idx === 0) onPrimeiraDica?.()
      return [...prev, listaDicas[idx]]
    })

    setDicasUsadas(prev => prev + 1)
  }, [listaDicas, onPrimeiraDica])

  const fecharAnuncio = useCallback(() => {
    setShowAnuncioDica(false)
  }, [])

  return {
    dicasReveladas,
    dicasUsadas,
    showAnuncioDica,
    podeVerMaisDicas,
    pedirDica,
    liberarProximaDica,
    fecharAnuncio,
  }
}
