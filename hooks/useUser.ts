'use client'
import { useSession } from 'next-auth/react'

export function useUser() {
  const { data: session, status } = useSession()
  return {
    user: session?.user ?? null,
    isPro: (session?.user as any)?.isPro ?? false,
    isAdmin: (session?.user as any)?.isAdmin ?? false,
    totalXp: (session?.user as any)?.totalXp ?? 0,
    streak: (session?.user as any)?.streak ?? 0,
    loading: status === 'loading',
    authenticated: status === 'authenticated',
  }
}
