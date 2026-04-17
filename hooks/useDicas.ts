'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

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
 * Todos os callbacks são completamente estáveis (deps []) — usam refs
 * para acessar sempre os valores mais recentes sem recriação de funções.
 * Isso elimina race conditions onde o AnuncioVideo usa uma versão stale
 * de liberarProximaDica via onConcluidoRef quando a callback do AdMob
 * chega de fora do ciclo de render do React.
 *
 * O side-effect de onPrimeiraDica é executado via useEffect (não dentro
 * do updater), garantindo que rode exatamente uma vez e sem violar as
 * regras do React para funções puras de state update.
 */
export function useDicas({
  listaDicas,
  isPro,
  onPrimeiraDica,
}: UseDicasOptions): UseDicasReturn {
  const [dicasReveladas, setDicasReveladas] = useState<string[]>([])
  const [dicasUsadas, setDicasUsadas] = useState(0)
  const [showAnuncioDica, setShowAnuncioDica] = useState(false)

  // Refs sempre apontam para os valores mais recentes — sem stale closures
  const listaDicasRef = useRef(listaDicas)
  const dicasReveladasRef = useRef<string[]>([])
  const onPrimeiraDicaRef = useRef(onPrimeiraDica)
  const isProRef = useRef(isPro)

  useEffect(() => { listaDicasRef.current = listaDicas }, [listaDicas])
  useEffect(() => { dicasReveladasRef.current = dicasReveladas }, [dicasReveladas])
  useEffect(() => { onPrimeiraDicaRef.current = onPrimeiraDica }, [onPrimeiraDica])
  useEffect(() => { isProRef.current = isPro }, [isPro])

  const podeVerMaisDicas = dicasReveladas.length < listaDicas.length

  // Side-effect: aplica preenchimento do editor na primeira dica revelada.
  // Executado via useEffect (fora do updater) para não violar pureza funcional.
  const primeiraDicaAplicadaRef = useRef(false)
  useEffect(() => {
    if (!primeiraDicaAplicadaRef.current && dicasReveladas.length > 0) {
      primeiraDicaAplicadaRef.current = true
      onPrimeiraDicaRef.current?.()
    }
  }, [dicasReveladas.length])

  /**
   * Abre o anúncio (grátis) ou revela todas as dicas de uma vez (Pro).
   * Estável — não precisa ser recriado quando listaDicas, isPro ou
   * dicasReveladas mudam.
   */
  const pedirDica = useCallback(() => {
    const lista = listaDicasRef.current
    const reveladas = dicasReveladasRef.current

    if (lista.length === 0) return
    if (reveladas.length >= lista.length) return

    if (isProRef.current) {
      setDicasReveladas(prev => {
        if (prev.length > 0) return prev // já revelou tudo
        return [...lista]
      })
      setDicasUsadas(1)
      return
    }

    setShowAnuncioDica(true)
  }, [])

  /**
   * Chamado pelo onConcluido do AnuncioVideo após o anúncio ser assistido.
   * Completamente estável (deps []) — usa listaDicasRef para sempre ter
   * a lista correta, mesmo se este callback foi capturado antes da última
   * atualização de onConcluidoRef no AnuncioVideo.
   */
  const liberarProximaDica = useCallback(() => {
    setShowAnuncioDica(false)

    const lista = listaDicasRef.current
    setDicasReveladas(prev => {
      const idx = prev.length
      if (idx >= lista.length) return prev
      return [...prev, lista[idx]]
    })

    setDicasUsadas(prev => prev + 1)
  }, [])

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
