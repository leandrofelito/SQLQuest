'use client'
import { useEffect, useCallback, ReactNode } from 'react'

// ─── Obfuscação de texto ────────────────────────────────────────────────────
// Insere caracteres Unicode invisíveis a cada N caracteres visíveis.
// O texto renderizado é idêntico ao original; ao colar em uma IA o prompt
// fica corrompido com sequências \u200B\u200C\u200D intercaladas.
const INVISIBLE = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\u200E', '\u200F']
const INTERVAL = 4 // a cada 4 caracteres visíveis, injeta 1 invisível

export function ofuscarTexto(texto: string): string {
  let resultado = ''
  let visiveis = 0
  let invisIdx = 0
  for (const ch of texto) {
    resultado += ch
    visiveis++
    if (visiveis % INTERVAL === 0) {
      resultado += INVISIBLE[invisIdx % INVISIBLE.length]
      invisIdx++
    }
  }
  return resultado
}

// ─── Componente de proteção para enunciados ──────────────────────────────────
interface EnunciadoSeguroProps {
  texto: string
  className?: string
}

export function EnunciadoSeguro({ texto, className }: EnunciadoSeguroProps) {
  const bloquear = useCallback((e: React.SyntheticEvent) => e.preventDefault(), [])

  return (
    <p
      className={className}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onCopy={bloquear}
      onCut={bloquear}
      onContextMenu={bloquear}
      // Dado ofuscado como dangerouslySetInnerHTML para suportar Unicode invisível
      dangerouslySetInnerHTML={{ __html: ofuscarTexto(texto) }}
    />
  )
}

// ─── Wrapper de segurança para o bloco inteiro do desafio ────────────────────
interface DesafioSeguroProps {
  children: ReactNode
  /** Quando true (padrão), bloqueia F12 e atalhos de DevTools */
  bloquearDevTools?: boolean
  /** Quando true, bloqueia Ctrl+C e Ctrl+V em todo o wrapper */
  bloquearCopyCola?: boolean
}

export function DesafioSeguro({
  children,
  bloquearDevTools = true,
  bloquearCopyCola = true,
}: DesafioSeguroProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey

      // F12
      if (bloquearDevTools && e.key === 'F12') {
        e.preventDefault()
        return
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
      if (bloquearDevTools && ctrl && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault()
        return
      }

      // Ctrl+U (ver código-fonte)
      if (bloquearDevTools && ctrl && e.key.toUpperCase() === 'U') {
        e.preventDefault()
        return
      }

      // Ctrl+C e Ctrl+V dentro do wrapper (apenas texto — não bloqueia o editor SQL)
      if (bloquearCopyCola && ctrl && ['C', 'V', 'X'].includes(e.key.toUpperCase())) {
        const active = document.activeElement
        // Permite copiar/colar dentro de textarea (editor SQL) e input
        const isEditor = active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement
        if (!isEditor) {
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [bloquearDevTools, bloquearCopyCola])

  function bloquear(e: React.SyntheticEvent) {
    e.preventDefault()
  }

  return (
    <div
      onCopy={bloquear}
      onCut={bloquear}
      onContextMenu={bloquear}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      // Re-habilita seleção em elementos filhos que precisam (ex: editor SQL)
      // via className aplicado no textarea: style={{ userSelect: 'text' }}
    >
      {children}
    </div>
  )
}

// ─── Hook para usar fora de JSX ───────────────────────────────────────────────
// Permite ativar a proteção de teclado em qualquer componente de página.
export function useAntiCheat({ ativo = true }: { ativo?: boolean } = {}) {
  useEffect(() => {
    if (!ativo) return

    function handler(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey
      if (e.key === 'F12') { e.preventDefault(); return }
      if (ctrl && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [ativo])
}
