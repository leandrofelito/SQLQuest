import { calculateProgress } from '../lib/calculateProgress'
import { getLevelBadge, xpParaNivel } from '../lib/xp'

// ---------------------------------------------------------------------------
// Constantes auxiliares (derivadas da fórmula 150*(n-1)*n)
// ---------------------------------------------------------------------------
const XP_NIVEL: Record<number, number> = {
  1: 0,       // 150*0*1
  2: 300,     // 150*1*2
  3: 900,     // 150*2*3
  4: 1_800,   // 150*3*4
  5: 3_000,   // 150*4*5
  10: 13_500, // 150*9*10
  100: 1_485_000, // 150*99*100
}

// ---------------------------------------------------------------------------
// Bloco 1 — Cálculo de estrelas
// ---------------------------------------------------------------------------
describe('calculateProgress — estrelas', () => {
  test('1ª tentativa, sem dica → 3 estrelas', () => {
    expect(calculateProgress(1, false, 0).estrelas).toBe(3)
  })

  test('2ª tentativa, sem dica → 2 estrelas', () => {
    expect(calculateProgress(2, false, 0).estrelas).toBe(2)
  })

  test('3ª tentativa, sem dica → 2 estrelas (regra do código: só dica reduz para 1)', () => {
    expect(calculateProgress(3, false, 0).estrelas).toBe(2)
  })

  test('1ª tentativa com dica → 1 estrela', () => {
    expect(calculateProgress(1, true, 0).estrelas).toBe(1)
  })

  test('5ª tentativa com dica → 1 estrela', () => {
    expect(calculateProgress(5, true, 0).estrelas).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — XP ganho (base + bônus)
// ---------------------------------------------------------------------------
describe('calculateProgress — xpGanho', () => {
  // Tabela de referência:
  //   3 estrelas → 100 base + 50 (1ª tent.) + 30 (sem dica) = 180
  //   2 estrelas → 60  base + 0             + 30 (sem dica) = 90
  //   1 estrela  → 30  base + 50 (1ª tent.) + 0             = 80
  //   1 estrela  → 30  base + 0             + 0             = 30

  test('3 estrelas: 100 + 50 + 30 = 180 XP', () => {
    expect(calculateProgress(1, false, 0).xpGanho).toBe(180)
  })

  test('2 estrelas (2ª tent.): 60 + 30 = 90 XP', () => {
    expect(calculateProgress(2, false, 0).xpGanho).toBe(90)
  })

  test('2 estrelas (3ª tent.): 60 + 30 = 90 XP', () => {
    expect(calculateProgress(3, false, 0).xpGanho).toBe(90)
  })

  test('1 estrela com 1ª tentativa: 30 + 50 = 80 XP', () => {
    expect(calculateProgress(1, true, 0).xpGanho).toBe(80)
  })

  test('1 estrela sem bônus: 30 XP', () => {
    expect(calculateProgress(3, true, 0).xpGanho).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — xpTotal acumulado
// ---------------------------------------------------------------------------
describe('calculateProgress — xpTotal', () => {
  test('xpAtual 0 + 180 = 180', () => {
    expect(calculateProgress(1, false, 0).xpTotal).toBe(180)
  })

  test('xpAtual 120 + 180 = 300', () => {
    expect(calculateProgress(1, false, 120).xpTotal).toBe(300)
  })

  test('xpAtual 450 + 90 = 540', () => {
    expect(calculateProgress(2, false, 450).xpTotal).toBe(540)
  })
})

// ---------------------------------------------------------------------------
// Bloco 4 — Transição de nível
// ---------------------------------------------------------------------------
describe('calculateProgress — transição de nível', () => {
  test('xpTotal 180 → nível 1 (abaixo dos 300 para nível 2)', () => {
    expect(calculateProgress(1, false, 0).novoNivel).toBe(1)
  })

  test('xpAtual 120 + 180 = 300 → nível 2 exato', () => {
    // xpParaNivel(2) = 300
    expect(calculateProgress(1, false, 120).novoNivel).toBe(2)
  })

  test('xpAtual 450 + 90 = 540 → permanece nível 2', () => {
    expect(calculateProgress(2, false, 450).novoNivel).toBe(2)
  })

  test('xpAtual 810 + 180 = 990 → sobe para nível 3 (limiar 900)', () => {
    expect(calculateProgress(1, false, 810).novoNivel).toBe(3)
  })

  test('fórmula xpParaNivel(n) = 150*(n-1)*n é consistente com os limiares usados', () => {
    expect(xpParaNivel(1)).toBe(XP_NIVEL[1])
    expect(xpParaNivel(2)).toBe(XP_NIVEL[2])
    expect(xpParaNivel(5)).toBe(XP_NIVEL[5])
    expect(xpParaNivel(10)).toBe(XP_NIVEL[10])
    expect(xpParaNivel(100)).toBe(XP_NIVEL[100])
  })
})

// ---------------------------------------------------------------------------
// Bloco 5 — Transição de tier Aprendiz → Iniciante (nível 4 → 5)
// ---------------------------------------------------------------------------
describe('calculateProgress — transição de tier Aprendiz → Iniciante', () => {
  // Nível 4 = aprendiz  (xpParaNivel(4) = 1.800)
  // Nível 5 = iniciante (xpParaNivel(5) = 3.000)

  test('xpAtual 2.910 + 90 = 3.000 → nível 5 (Iniciante)', () => {
    const result = calculateProgress(2, false, 2_910)
    expect(result.xpTotal).toBe(3_000)
    expect(result.novoNivel).toBe(5)
    expect(getLevelBadge(result.novoNivel).tier).toBe('iniciante')
  })

  test('xpAtual 2.820 + 180 = 3.000 → nível 5 (Iniciante)', () => {
    const result = calculateProgress(1, false, 2_820)
    expect(result.xpTotal).toBe(3_000)
    expect(result.novoNivel).toBe(5)
    expect(getLevelBadge(result.novoNivel).tier).toBe('iniciante')
  })

  test('xpAtual 2.800 + 180 = 2.980 → ainda nível 4 (Aprendiz)', () => {
    const result = calculateProgress(1, false, 2_800)
    expect(result.xpTotal).toBe(2_980)
    expect(result.novoNivel).toBe(4)
    expect(getLevelBadge(result.novoNivel).tier).toBe('aprendiz')
  })

  test('tier no limiar exato nível 10 → explorador', () => {
    // xpParaNivel(10) = 13.500; xpAtual = 13.500 - 90 = 13.410
    const result = calculateProgress(2, false, 13_410)
    expect(result.novoNivel).toBe(10)
    expect(getLevelBadge(result.novoNivel).tier).toBe('explorador')
  })
})

// ---------------------------------------------------------------------------
// Bloco 6 — Nível máximo 100
// ---------------------------------------------------------------------------
describe('calculateProgress — nível máximo 100', () => {
  // xpParaNivel(100) = 1.485.000

  test('atinge exatamente o nível 100', () => {
    // 1.484.820 + 180 = 1.485.000
    const result = calculateProgress(1, false, 1_484_820)
    expect(result.xpTotal).toBe(1_485_000)
    expect(result.novoNivel).toBe(100)
    expect(getLevelBadge(result.novoNivel).tier).toBe('lendario')
  })

  test('XP além do limiar: nível continua 100 (cap)', () => {
    const result = calculateProgress(1, false, 1_485_000)
    expect(result.novoNivel).toBe(100)
  })

  test('XP muito acima: nível ainda 100', () => {
    const result = calculateProgress(1, false, 1_500_000)
    expect(result.novoNivel).toBe(100)
  })

  test('usuário no nível 100 ganha XP normalmente: xpTotal cresce, nível mantém 100', () => {
    const antes = calculateProgress(2, false, 1_485_000)
    const depois = calculateProgress(2, false, 1_500_000)
    expect(depois.xpTotal).toBeGreaterThan(antes.xpTotal)
    expect(depois.novoNivel).toBe(100)
    expect(antes.novoNivel).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Bloco 7 — Casos de borda
// ---------------------------------------------------------------------------
describe('calculateProgress — casos de borda', () => {
  test('xpAtual zero → retorna nível 1', () => {
    expect(calculateProgress(1, false, 0).novoNivel).toBe(1)
  })

  test('xpAtual negativo → tratado como 0 (nível 1)', () => {
    const result = calculateProgress(1, false, -100)
    expect(result.xpTotal).toBe(180) // max(0, -100) + 180
    expect(result.novoNivel).toBe(1)
  })

  test('tentativas zero → 2 estrelas (não é 1ª tentativa, sem dica)', () => {
    const result = calculateProgress(0, false, 0)
    expect(result.estrelas).toBe(2)
    expect(result.xpGanho).toBe(90) // 60 + 30
  })

  test('estrelas e xpGanho não mudam se xpAtual variar', () => {
    const r1 = calculateProgress(1, false, 0)
    const r2 = calculateProgress(1, false, 5_000)
    expect(r1.estrelas).toBe(r2.estrelas)
    expect(r1.xpGanho).toBe(r2.xpGanho)
  })
})
