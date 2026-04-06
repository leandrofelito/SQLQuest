interface PrestigeBadgeProps {
  prestige: number
  size?: 'sm' | 'md'
}

/** Sparkle SVG inline — sem dependência de lucide */
function SparkleIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#facc15"
      style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.75))' }}
      aria-hidden
    >
      {/* estrela principal */}
      <path d="M12 2 L13.8 8.2 L20 10 L13.8 11.8 L12 18 L10.2 11.8 L4 10 L10.2 8.2 Z" />
      {/* estrela pequena superior direita */}
      <path d="M19 2 L19.9 4.6 L22.5 5.5 L19.9 6.4 L19 9 L18.1 6.4 L15.5 5.5 L18.1 4.6 Z" opacity="0.7" />
    </svg>
  )
}

/**
 * Badge de prestígio — mostra ícone de estrela + contagem de estrelas (★).
 * Até 5 estrelas visíveis; acima disso exibe "+N".
 */
export function PrestigeBadge({ prestige, size = 'sm' }: PrestigeBadgeProps) {
  if (prestige <= 0) return null

  const stars = Math.min(prestige, 5)
  const extra = prestige > 5 ? prestige - 5 : 0
  const iconSize = size === 'sm' ? 11 : 14
  const textCls = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${textCls} font-bold text-yellow-400`}
      title={`Prestígio ${prestige}`}
      style={{ textShadow: '0 0 8px rgba(250,204,21,0.55)' }}
    >
      <SparkleIcon size={iconSize} />
      {'★'.repeat(stars)}
      {extra > 0 && <span className="text-yellow-400/70">+{extra}</span>}
    </span>
  )
}
