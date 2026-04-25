'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MarcarVisitadaResult =
  | { success: false; error: string }
  | { success: true; fallback?: true }

// ─── Input schema ─────────────────────────────────────────────────────────────

const schema = z.object({
  trilhaId: z.string().min(1),
  etapaId: z.string().min(1),
  // fallback: true quando salvarProgressoAction falhou — marca exercício com 0 XP para
  // que o guard da próxima etapa passe, sem sobrescrever XP legítimo existente
  fallback: z.boolean().optional(),
})

export type MarcarVisitadaInput = z.infer<typeof schema>

// ─── Action ───────────────────────────────────────────────────────────────────

export async function marcarVisitadaAction(
  input: MarcarVisitadaInput,
): Promise<MarcarVisitadaResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { success: false, error: 'Não autenticado' }

  const userId = (session.user as { id: string }).id

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Dados inválidos' }

  const { trilhaId, etapaId, fallback } = parsed.data

  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    select: { tipo: true, trilhaId: true },
  })
  if (!etapa) return { success: false, error: 'Etapa não encontrada' }

  if (etapa.tipo === 'exercicio' && !fallback) {
    return { success: false, error: 'Exercícios devem usar salvarProgressoAction' }
  }

  if (etapa.trilhaId !== trilhaId) {
    return { success: false, error: 'Trilha inválida para esta etapa' }
  }

  if (etapa.tipo === 'exercicio' && fallback) {
    const existente = await prisma.progresso.findUnique({
      where: { userId_etapaId: { userId, etapaId } },
    })
    if (!existente) {
      await prisma.progresso.create({
        data: { userId, trilhaId, etapaId, xpGanho: 0, tentativas: 1, usouDica: false, estrelas: 0 },
      })
    }
    return { success: true, fallback: true }
  }

  // Upsert: marca etapa de leitura/intro/resumo/conclusao como visitada sem conceder XP
  await prisma.progresso.upsert({
    where: { userId_etapaId: { userId, etapaId } },
    create: { userId, trilhaId, etapaId, xpGanho: 0, tentativas: 1, usouDica: false, estrelas: 0 },
    update: {},
  })

  return { success: true }
}
