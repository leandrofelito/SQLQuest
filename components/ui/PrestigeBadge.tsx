import { PRESTIGIO_ESTRELAS_POR_TIER } from '@/lib/prestigio'

interface PrestigeBadgeProps {
  prestige: number
  size?: 'sm' | 'md'
}

/**
 * Estrelas de prestígio (metais):
 * - Cada vez que o jogador atinge o nível máximo do ciclo e ativa o prestígio, ganha +1 estrela (XP zera).
 * - PRESTIGIO_ESTRELAS_POR_TIER estrelas no mesmo metal → sobe de tier: Bronze → Prata → Ouro → Rubi.
 */
const TIERS = [
  { name: 'Bronze', color: '#cd7f32', glow: 'rgba(205,127,50,0.7)', shadow: 'rgba(205,127,50,0.4)' },
  { name: 'Prata',  color: '#c0c0c0', glow: 'rgba(192,192,192,0.7)', shadow: 'rgba(192,192,192,0.4)' },
  { name: 'Ouro',   color: '#facc15', glow: 'rgba(250,204,21,0.75)', shadow: 'rgba(250,204,21,0.55)' },
  { name: 'Rubi',   color: '#ef4444', glow: 'rgba(239,68,68,0.75)',  shadow: 'rgba(239,68,68,0.55)' },
] as const

const STARS_PER_TIER = PRESTIGIO_ESTRELAS_POR_TIER

/** Estrela SVG para tier preenchido (∗ pequena) */
function MiniStar({ color }: { color: string }) {
  return (
    <svg width={8} height={8} viewBox="0 0 24 24" fill={color} aria-hidden style={{ opacity: 0.85 }}>
      <path d="M12 2 L13.8 8.2 L20 10 L13.8 11.8 L12 18 L10.2 11.8 L4 10 L10.2 8.2 Z" />
    </svg>
  )
}

/** Estrela SVG principal */
function StarIcon({ size, color, glow }: { size: number; color: string; glow: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ filter: `drop-shadow(0 0 3px ${glow})` }}
      aria-hidden
    >
      <path d="M12 2 L13.8 8.2 L20 10 L13.8 11.8 L12 18 L10.2 11.8 L4 10 L10.2 8.2 Z" />
      <path d="M19 2 L19.9 4.6 L22.5 5.5 L19.9 6.4 L19 9 L18.1 6.4 L15.5 5.5 L18.1 4.6 Z" opacity="0.7" />
    </svg>
  )
}

/**
 * Retorna o tier atual e quantas estrelas estão preenchidas nesse tier.
 *  - tier index: 0=bronze, 1=prata, 2=ouro, 3=rubi (máximo — não avança além)
 *  - starsInTier: 1-5
 *  - completedTiers: quantos tiers completos o usuário passou
 */
export function getPrestigeTier(prestige: number) {
  if (prestige <= 0) return { tierIndex: 0, starsInTier: 0, completedTiers: 0 }
  const rawTier = Math.floor((prestige - 1) / STARS_PER_TIER)
  const tierIndex = Math.min(rawTier, TIERS.length - 1)
  const starsInTier = tierIndex < TIERS.length - 1
    ? ((prestige - 1) % STARS_PER_TIER) + 1
    // No último tier (rubi) acumula indefinidamente, mostra até 5 + indicador de excesso
    : Math.min(((prestige - 1) % STARS_PER_TIER) + 1, STARS_PER_TIER)
  const completedTiers = Math.min(rawTier, TIERS.length - 1)
  return { tierIndex, starsInTier, completedTiers }
}

/**
 * Badge de prestígio com sistema de cores progressivo.
 * Mostra até 5 estrelas na cor do tier atual + bolinhas dos tiers anteriores completos.
 */
export function PrestigeBadge({ prestige, size = 'sm' }: PrestigeBadgeProps) {
  if (prestige <= 0) return null

  const { tierIndex, starsInTier, completedTiers } = getPrestigeTier(prestige)
  const tier = TIERS[tierIndex]
  const iconSize = size === 'sm' ? 11 : 14
  const textCls = size === 'sm' ? 'text-[10px]' : 'text-xs'

  // Excesso além do tier rubi (prestige > 20): mostra "+N"
  const rubiExtra = tierIndex === TIERS.length - 1 && prestige > TIERS.length * STARS_PER_TIER
    ? prestige - TIERS.length * STARS_PER_TIER
    : 0

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${textCls} font-bold`}
      style={{ color: tier.color, textShadow: `0 0 8px ${tier.shadow}` }}
      title={`Prestígio ${prestige} — ${tier.name} (${starsInTier}/${STARS_PER_TIER} estrelas)`}
    >
      {/* Bolinhas indicando tiers anteriores completos */}
      {completedTiers > 0 && (
        <span className="inline-flex items-center gap-px mr-0.5">
          {Array.from({ length: completedTiers }).map((_, i) => (
            <MiniStar key={i} color={TIERS[i].color} />
          ))}
        </span>
      )}

      {/* Ícone principal + estrelas do tier atual */}
      <StarIcon size={iconSize} color={tier.color} glow={tier.glow} />
      {'★'.repeat(starsInTier)}

      {/* Excesso no tier rubi */}
      {rubiExtra > 0 && (
        <span style={{ color: tier.color, opacity: 0.7 }}>+{rubiExtra}</span>
      )}
    </span>
  )
}
