import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export const ACCOUNT_DELETION_GRACE_DAYS = 7

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

async function preservePremiumEntitlementTx(
  tx: Prisma.TransactionClient,
  user: { email: string; isPro: boolean; proAt: Date | null },
) {
  if (!user.isPro) return

  await tx.premiumEntitlement.upsert({
    where: { email: normalizeEmail(user.email) },
    update: {
      proAt: user.proAt ?? new Date(),
      source: 'account_deletion',
    },
    create: {
      email: normalizeEmail(user.email),
      proAt: user.proAt ?? new Date(),
      source: 'account_deletion',
    },
  })
}

export async function purgeExpiredAccountDeletions(now = new Date()) {
  const expired = await prisma.user.findMany({
    where: {
      deletionScheduledAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      email: true,
      isPro: true,
      proAt: true,
    },
    take: 50,
  })

  for (const user of expired) {
    await prisma.$transaction(async tx => {
      await preservePremiumEntitlementTx(tx, user)
      await tx.user.delete({ where: { id: user.id } })
    })
  }
}

export async function requestAccountDeletion(userId: string) {
  const now = new Date()
  const scheduledAt = addDays(now, ACCOUNT_DELETION_GRACE_DAYS)

  return prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isPro: true, proAt: true },
    })

    if (!user) return null

    await preservePremiumEntitlementTx(tx, user)

    return tx.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: now,
        deletionScheduledAt: scheduledAt,
      },
      select: {
        deletionRequestedAt: true,
        deletionScheduledAt: true,
      },
    })
  })
}

export async function cancelAccountDeletion(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      deletionRequestedAt: null,
      deletionScheduledAt: null,
    },
    select: {
      deletionRequestedAt: true,
      deletionScheduledAt: true,
    },
  })
}

export async function reactivateAccountIfInGracePeriod(email: string, now = new Date()) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      deletionScheduledAt: true,
    },
  })

  if (!user?.deletionScheduledAt) return { status: 'none' as const }

  if (user.deletionScheduledAt <= now) {
    await purgeExpiredAccountDeletions(now)
    return { status: 'expired' as const }
  }

  await cancelAccountDeletion(user.id)
  return { status: 'reactivated' as const }
}

export async function applyPremiumEntitlementByEmail(userId: string, email: string) {
  const entitlement = await prisma.premiumEntitlement.findUnique({
    where: { email: normalizeEmail(email) },
  })

  if (!entitlement) return

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPro: true,
      proAt: entitlement.proAt ?? new Date(),
    },
  })
}
