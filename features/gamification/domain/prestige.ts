/**
 * Prestígio (estrelas metálicas no perfil / ranking):
 * - Ao atingir o nível mínimo, o ciclo reinicia automaticamente: totalXp zera, nível volta a 1, prestige += 1.
 * - O ranking global usa User.xpRanking (só aumenta), para a posição não cair ao prestigiar.
 * - Cada ativação conta como 1 estrela no tier atual (Bronze → Prata → Ouro → Rubi).
 * - A cada ESTRELAS_POR_TIER prestígios completos no mesmo metal, sobe-se ao próximo tier.
 */
export const PRESTIGIO_NIVEL_MINIMO = 100

export const PRESTIGIO_ESTRELAS_POR_TIER = 5

/** Quantas conquistas de estrela de prestígio existem na lista (uma por ativação, até este número). */
export const PRESTIGIO_CONQUISTAS_CAP = 250
