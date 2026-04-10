'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      const forceLogout = localStorage.getItem('sqlquest_force_logout')
      if (forceLogout) {
        // Usuário havia solicitado logout mas o app foi fechado antes de completar
        localStorage.removeItem('sqlquest_force_logout')
        localStorage.removeItem('sqlquest_keep_logged_in')
        sessionStorage.removeItem('sqlquest_session_active')
        signOut({ callbackUrl: '/login' })
      }
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[#8b5cf6] text-lg font-bold">SQLQuest</div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return <>{children}</>
}
