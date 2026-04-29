'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  // Evita desmontar os filhos quando a sessão é apenas atualizada em background (status volta a 'loading' brevemente)
  const everAuthenticated = useRef(false)

  useEffect(() => {
    if (status === 'authenticated') {
      everAuthenticated.current = true
    }
  }, [status])

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

  if (status === 'loading' && !everAuthenticated.current) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex flex-col items-center justify-center gap-6">
        <img src="/brand/logooficialSQLQUESTpng-Photoroom.png" alt="SQLQuest" className="w-40 h-40 object-contain" />
        <div className="w-8 h-8 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return <>{children}</>
}
