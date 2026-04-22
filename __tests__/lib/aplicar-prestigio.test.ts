// ---------------------------------------------------------------------------
// Mocks — previne instanciação do PrismaClient real durante import
// ---------------------------------------------------------------------------
jest.mock('@/lib/db', () => ({
  prisma: { $transaction: jest.fn() },
}))

jest.mock('@/lib/conquistas-definitions', () => ({
  buildPrestigeConquistaNotificacao: jest.fn().mockReturnValue({
    id: 'prestige-conquista-1',
    emoji: '⭐',
    nome: 'Prestígio I',
  }),
}))

// ---------------------------------------------------------------------------
// Imports — lib/xp e lib/prestigio são reais (lógica de negócio)
// ---------------------------------------------------------------------------
import { aplicarPrestigioSeElegivelTx } from '../../lib/aplicar-prestigio'
import { xpParaNivel } from '../../lib/xp'
import { PRESTIGIO_NIVEL_MINIMO, PRESTIGIO_CONQUISTAS_CAP } from '../../lib/prestigio'

// ---------------------------------------------------------------------------
// Helper: cria um mock de Prisma.TransactionClient focado nas operações usadas
// pela função testada (tx.user.findUnique e tx.user.update).
// ---------------------------------------------------------------------------
function makeTx(userState: { totalXp: number; prestige: number }) {
  const afterPrestige = { totalXp: 0, prestige: userState.prestige + 1 }
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(userState),
      update: jest.fn().mockResolvedValue(afterPrestige),
    },
  }
}

// XP exato para atingir o nível mínimo de prestígio (100)
const XP_NIVEL_100 = xpParaNivel(PRESTIGIO_NIVEL_MINIMO) // 1_485_000

// ---------------------------------------------------------------------------
// Bloco 1 — Condições de elegibilidade
// ---------------------------------------------------------------------------
describe('aplicarPrestigioSeElegivelTx — elegibilidade', () => {
  test('usuário abaixo do nível 100 → applied: false, sem update', async () => {
    const tx = makeTx({ totalXp: 1_000, prestige: 0 }) // ~nível 3
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    expect(result.applied).toBe(false)
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  test('userId inexistente (findUnique retorna null) → applied: false', async () => {
    const tx = { user: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } }
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-inexistente')

    expect(result.applied).toBe(false)
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  test(`prestígio no cap (${PRESTIGIO_CONQUISTAS_CAP}) → applied: false`, async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: PRESTIGIO_CONQUISTAS_CAP })
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    expect(result.applied).toBe(false)
    expect(tx.user.update).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Bloco 2 — Aplicação do prestígio
// ---------------------------------------------------------------------------
describe('aplicarPrestigioSeElegivelTx — aplicação', () => {
  test(`nível exato ${PRESTIGIO_NIVEL_MINIMO} (XP = ${XP_NIVEL_100}) → applied: true`, async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 0 })
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    expect(result.applied).toBe(true)
  })

  test('totalXp zerado após prestígio → retorna totalXp: 0', async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 0 })
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    expect(result.totalXp).toBe(0)
  })

  test('prestige incrementado de 0 → 1', async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 0 })
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    expect(result.novoPrestige).toBe(1)
  })

  test('acúmulo: 2º prestígio → novoPrestige: 3', async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 2 })
    tx.user.update.mockResolvedValue({ totalXp: 0, prestige: 3 })

    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')
    expect(result.novoPrestige).toBe(3)
  })

  test('retorna novasConquistas com ao menos 1 item', async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 0 })
    const result = await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    expect(result.novasConquistas).toBeDefined()
    expect(result.novasConquistas!.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Bloco 3 — Invariante crítica: xpRanking NUNCA é zerado pelo prestígio
// ---------------------------------------------------------------------------
describe('aplicarPrestigioSeElegivelTx — invariante xpRanking', () => {
  test('a chamada tx.user.update NÃO inclui xpRanking no data', async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 0 })
    await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    // A função deve atualizar apenas totalXp e prestige — nunca xpRanking
    const updateArgs = tx.user.update.mock.calls[0][0]
    expect(updateArgs.data).not.toHaveProperty('xpRanking')
  })

  test('a chamada tx.user.update APENAS contém { totalXp: 0, prestige: { increment: 1 } }', async () => {
    const tx = makeTx({ totalXp: XP_NIVEL_100, prestige: 0 })
    await aplicarPrestigioSeElegivelTx(tx as any, 'user-1')

    const updateArgs = tx.user.update.mock.calls[0][0]
    expect(updateArgs.data).toEqual({
      totalXp: 0,
      prestige: { increment: 1 },
    })
  })

  test('xpRanking acumulado permanece intacto: simulação de 2 prestígios', async () => {
    // Simula o fluxo real: a rota /api/progresso incrementa xpRanking ANTES do prestígio,
    // e aplicarPrestigioSeElegivelTx só zera totalXp. Validamos que após 2 prestígios
    // o xpRanking continua crescendo.
    let xpRanking = 0
    let totalXp = 0
    let prestige = 0

    async function simularConcluirEtapa(xpGanho: number) {
      // 1. Incrementa ambos (simula o que a rota faz antes de chamar prestígio)
      xpRanking += xpGanho
      totalXp += xpGanho

      // 2. Aplica prestígio se elegível
      const tx = {
        user: {
          findUnique: jest.fn().mockResolvedValue({ totalXp, prestige }),
          update: jest.fn().mockImplementation(({ data }: any) => {
            // Aplica o update ao estado local
            if (data.totalXp === 0) totalXp = 0
            if (data.prestige?.increment) prestige += data.prestige.increment
            // xpRanking NÃO é tocado pela função
            return Promise.resolve({ totalXp, prestige })
          }),
        },
      }
      await aplicarPrestigioSeElegivelTx(tx as any, 'user-sim')
    }

    // Primeiro ciclo: adiciona XP até o nível 100
    await simularConcluirEtapa(XP_NIVEL_100)
    expect(xpRanking).toBe(XP_NIVEL_100)
    expect(totalXp).toBe(0)
    expect(prestige).toBe(1)

    // Segundo ciclo
    await simularConcluirEtapa(XP_NIVEL_100)
    expect(xpRanking).toBe(XP_NIVEL_100 * 2) // sempre cresce
    expect(totalXp).toBe(0)
    expect(prestige).toBe(2)
  })
})
